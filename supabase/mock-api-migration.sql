-- ═══════════════════════════════════════════════════════
-- Миграция: Mock API / test-песочница (/mock-api)
-- ═══════════════════════════════════════════════════════
-- Выполнить ОДИН РАЗ в SQL Editor Supabase (Dashboard → SQL Editor →
-- New query → вставить и Run), ДО деплоя фронтенда — без этой миграции
-- страница /mock-api будет падать при любой попытке создать endpoint,
-- добавить route или вызвать сам мок по его публичному URL. Все
-- операторы идемпотентны, безопасно выполнить повторно.

-- Один пользователь может завести несколько mock-эндпоинтов (лимит —
-- на стороне фронтенда, см. lib/hooks/useMockEndpoints.ts, тот же
-- принцип, что уже применён к Workbench: free/Pro лимиты проверяются
-- в хуке, а не через отдельный constraint в БД). slug — случайная
-- строка, генерируется на клиенте через crypto.randomUUID() перед
-- вставкой; уникальность гарантирует сама база (UNIQUE), а не
-- проверка "занят ли slug" заранее — коллизия при такой длине
-- практически невозможна.
CREATE TABLE IF NOT EXISTS mock_endpoints (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug        text NOT NULL UNIQUE,
  name        text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Внутри одного эндпоинта — несколько "маршрутов": метод + путь →
-- фиксированный ответ. hit_count/last_called_at обновляются функцией
-- get_mock_route() ниже при каждом реальном вызове — это даёт
-- пользователю обратную связь "мок реально дёргают", а не просто
-- "страница сохранилась".
CREATE TABLE IF NOT EXISTS mock_routes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id     uuid NOT NULL REFERENCES mock_endpoints(id) ON DELETE CASCADE,
  method          text NOT NULL,
  path            text NOT NULL DEFAULT '/',
  status_code     integer NOT NULL DEFAULT 200,
  response_body   text NOT NULL DEFAULT '{}',
  delay_ms        integer NOT NULL DEFAULT 0,
  hit_count       integer NOT NULL DEFAULT 0,
  last_called_at  timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mock_routes_method_check CHECK (method IN ('GET','POST','PUT','PATCH','DELETE')),
  CONSTRAINT mock_routes_status_check CHECK (status_code BETWEEN 100 AND 599),
  CONSTRAINT mock_routes_delay_check  CHECK (delay_ms BETWEEN 0 AND 5000)
);

-- Один и тот же метод+путь внутри одного эндпоинта не может встречаться
-- дважды — вместо отдельного UI для редактирования существующего route,
-- фронтенд просто делает upsert по этим трём колонкам (пересоздание
-- маршрута с тем же методом+путём обновляет его, а не плодит дубликаты).
CREATE UNIQUE INDEX IF NOT EXISTS mock_routes_unique_route ON mock_routes(endpoint_id, method, path);
CREATE INDEX IF NOT EXISTS mock_routes_endpoint_idx ON mock_routes(endpoint_id);

ALTER TABLE mock_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_routes    ENABLE ROW LEVEL SECURITY;

-- Владелец может делать со своими эндпоинтами что угодно (читать,
-- создавать, переименовывать, удалять) — это единственная политика на
-- эту таблицу. Публичного чтения НЕТ: список чужих эндпоинтов/slug'ов
-- никому не виден, только сам владелец видит их в UI.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'mock_endpoints' AND policyname = 'mock_endpoints_own_row'
  ) THEN
    CREATE POLICY "mock_endpoints_own_row" ON mock_endpoints
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Аналогично для routes — доступ через владение родительским
-- эндпоинтом (mock_routes сама по себе не хранит user_id).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'mock_routes' AND policyname = 'mock_routes_own_endpoint'
  ) THEN
    CREATE POLICY "mock_routes_own_endpoint" ON mock_routes
      FOR ALL
      USING (endpoint_id IN (SELECT id FROM mock_endpoints WHERE user_id = auth.uid()))
      WITH CHECK (endpoint_id IN (SELECT id FROM mock_endpoints WHERE user_id = auth.uid()));
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════
-- Публичная выдача мока — единственная дверь наружу
-- ═══════════════════════════════════════════════════════
-- Сам смысл фичи — чтобы люди дёргали URL мока анонимно, из своих
-- тестов/curl/CI, без всякого логина. Но RLS выше запрещает читать
-- чужие (то есть вообще любые, для анонимного вызова) строки
-- напрямую. Решение то же, что и в калькуляторе зарплат
-- (supabase/salary-calculator-migration.sql): не открывать сырые
-- таблицы на публичное чтение (это дало бы возможность перебором
-- вытащить чужие slug'и и содержимое их моков через .select() без
-- фильтра), а завести SECURITY DEFINER функцию, которая находит РОВНО
-- один маршрут по конкретному slug+method+path и возвращает только
-- то, что нужно для ответа — ничего похожего на "список всех
-- эндпоинтов" через эту функцию получить нельзя.
--
-- Заодно функция увеличивает hit_count и обновляет last_called_at —
-- это не побочный эффект "втихую", а часть контракта: пользователь
-- ожидает увидеть в UI, что его мок реально вызывали.
CREATE OR REPLACE FUNCTION get_mock_route(
  p_slug   text,
  p_method text,
  p_path   text
)
RETURNS TABLE (
  status_code   integer,
  response_body text,
  delay_ms      integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_route mock_routes%ROWTYPE;
BEGIN
  SELECT r.* INTO v_route
  FROM mock_routes r
  JOIN mock_endpoints e ON e.id = r.endpoint_id
  WHERE e.slug = p_slug
    AND r.method = upper(p_method)
    AND r.path = p_path
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  UPDATE mock_routes
  SET hit_count = hit_count + 1, last_called_at = now()
  WHERE id = v_route.id;

  status_code   := v_route.status_code;
  response_body := v_route.response_body;
  delay_ms      := v_route.delay_ms;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION get_mock_route(text, text, text) TO anon, authenticated;
