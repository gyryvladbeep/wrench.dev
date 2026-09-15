-- ═══════════════════════════════════════════════════════
-- Миграция: Webhook Inspector (/webhook-inspector)
-- ═══════════════════════════════════════════════════════
-- Выполнить ОДИН РАЗ в SQL Editor Supabase (Dashboard → SQL Editor →
-- New query → вставить и Run), ДО деплоя фронтенда — без этой миграции
-- страница /webhook-inspector будет падать при любой попытке создать
-- бин или принять реальный webhook по его публичному URL. Все
-- операторы идемпотентны, безопасно выполнить повторно.

-- Один пользователь может завести несколько "бинов" — публичных URL,
-- на которые прилетают чужие HTTP-запросы (вебхук от Stripe/GitHub,
-- callback от собственного бэкенда и т.п.). Тот же принцип, что и у
-- mock_endpoints (supabase/mock-api-migration.sql): slug генерируется
-- на клиенте через crypto.randomUUID() перед вставкой, уникальность —
-- на UNIQUE, лимит количества бинов — на фронтенде (см.
-- lib/hooks/useWebhookBins.ts), не отдельным constraint'ом.
CREATE TABLE IF NOT EXISTS webhook_bins (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug        text NOT NULL UNIQUE,
  name        text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Каждая строка — один реально принятый HTTP-запрос. query/headers —
-- jsonb-словари "ключ → значение" (собираются в
-- app/api/hook/[slug]/[[...path]]/route.ts из URLSearchParams и
-- Headers), а не отдельные таблицы — набор ключей заранее не известен
-- и разный у каждого запроса, ровно как layout у Workbench.
-- source_ip — первый адрес из X-Forwarded-For (тот, что реально
-- проставляет Vercel), может быть NULL, если заголовка нет.
CREATE TABLE IF NOT EXISTS webhook_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bin_id        uuid NOT NULL REFERENCES webhook_bins(id) ON DELETE CASCADE,
  method        text NOT NULL,
  path          text NOT NULL DEFAULT '/',
  query         jsonb NOT NULL DEFAULT '{}'::jsonb,
  headers       jsonb NOT NULL DEFAULT '{}'::jsonb,
  body          text NOT NULL DEFAULT '',
  content_type  text,
  source_ip     text,
  received_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS webhook_requests_bin_idx ON webhook_requests(bin_id, received_at DESC);

ALTER TABLE webhook_bins     ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_requests ENABLE ROW LEVEL SECURITY;

-- Владелец может делать со своими бинами что угодно — единственная
-- политика на эту таблицу, публичного чтения нет (чужой список бинов/
-- slug'ов никому не виден, ровно как у mock_endpoints).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'webhook_bins' AND policyname = 'webhook_bins_own_row'
  ) THEN
    CREATE POLICY "webhook_bins_own_row" ON webhook_bins
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Аналогично для запросов — доступ через владение родительским бином
-- (webhook_requests сама по себе не хранит user_id). Owner-INSERT тут
-- разрешён "на всякий случай" (FOR ALL), но реально запросы в эту
-- таблицу пишет только SECURITY DEFINER функция ниже — обычный
-- authenticated-пользователь своих строк сюда напрямую не вставляет.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'webhook_requests' AND policyname = 'webhook_requests_own_bin'
  ) THEN
    CREATE POLICY "webhook_requests_own_bin" ON webhook_requests
      FOR ALL
      USING (bin_id IN (SELECT id FROM webhook_bins WHERE user_id = auth.uid()))
      WITH CHECK (bin_id IN (SELECT id FROM webhook_bins WHERE user_id = auth.uid()));
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════
-- Приём вебхука — единственная дверь снаружи
-- ═══════════════════════════════════════════════════════
-- Сюда прилетают анонимные запросы от чужих сервисов (Stripe, GitHub,
-- собственный бэкенд пользователя и т.д.) — RLS выше это в принципе не
-- пропустит напрямую (INSERT потребовал бы auth.uid(), которого у
-- анонимного отправителя нет). Тот же приём, что у get_mock_route()
-- (supabase/mock-api-migration.sql) и increment_workbench_clone_count()
-- (supabase/workbench-gallery-migration.sql): узкая SECURITY DEFINER
-- функция, которая делает ровно одну вещь — добавляет запрос в
-- КОНКРЕТНЫЙ бин по его slug, ничего похожего на "вставить куда
-- угодно" через неё получить нельзя. Возвращает false, если такого
-- slug не существует (роут выше превращает это в понятный 404 —
-- полезно для пользователя, который вставил URL с опечаткой).
--
-- После вставки функция сама подрезает историю запросов этого бина до
-- последних 50 — открытый в интернет URL мог бы иначе разрастить
-- таблицу без ограничений от кого угодно, включая самого владельца
-- бина, случайно зациклившего вызовы. Полноценного rate-limit'а здесь
-- нет (это потребовало бы отдельной инфраструктуры вроде Redis/KV) —
-- жёсткий потолок хранимой истории плюс лимит числа бинов на
-- фронтенде (free/Pro) держат худший случай ограниченным, тот же
-- компромисс, что уже принят в API Mini Load-Test.
CREATE OR REPLACE FUNCTION ingest_webhook_request(
  p_slug         text,
  p_method       text,
  p_path         text,
  p_query        jsonb,
  p_headers      jsonb,
  p_body         text,
  p_content_type text,
  p_source_ip    text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bin_id uuid;
BEGIN
  SELECT id INTO v_bin_id FROM webhook_bins WHERE slug = p_slug LIMIT 1;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  INSERT INTO webhook_requests (bin_id, method, path, query, headers, body, content_type, source_ip)
  VALUES (v_bin_id, upper(p_method), p_path, p_query, p_headers, p_body, p_content_type, p_source_ip);

  DELETE FROM webhook_requests
  WHERE bin_id = v_bin_id
    AND id NOT IN (
      SELECT id FROM webhook_requests
      WHERE bin_id = v_bin_id
      ORDER BY received_at DESC
      LIMIT 50
    );

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION ingest_webhook_request(text, text, text, jsonb, jsonb, text, text, text) TO anon, authenticated;
