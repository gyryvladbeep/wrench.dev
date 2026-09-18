-- ═══════════════════════════════════════════════════════
-- Миграция: личные токены API-доступа (пункт 13 из ROADMAP-BRAINSTORM.md
-- — GitHub Action для Mock API / Webhook Inspector нуждается в
-- авторизации от лица конкретного пользователя вне браузерной сессии)
-- ═══════════════════════════════════════════════════════
-- Выполнить ОДИН РАЗ в SQL Editor Supabase (Dashboard → SQL Editor →
-- New query → вставить и Run), ДО деплоя фронтенда. Идемпотентно,
-- безопасно выполнить повторно.

-- Сам токен НИКОГДА не хранится в базе целиком — только SHA-256 хэш
-- (token_hash), тот же принцип, что у паролей: утечка базы не даёт
-- ничего использовать напрямую. token_prefix — первые символы
-- сгенерированного токена в чистом виде, только для того, чтобы
-- пользователь отличал свои токены друг от друга в списке (см.
-- components/profile/ApiTokensPanel.tsx) — того же смысла, что первые
-- символы "ghp_" у GitHub или "sk_live_" у Stripe, не секрет сам по
-- себе. Полный токен показывается РОВНО один раз, в момент создания
-- (тот же UX, что у любого провайдера API-ключей) — после перезагрузки
-- страницы восстановить его невозможно даже владельцу, только отозвать
-- и создать новый.
CREATE TABLE IF NOT EXISTS api_tokens (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          text NOT NULL,
  token_hash    text NOT NULL UNIQUE,
  token_prefix  text NOT NULL,
  last_used_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  revoked_at    timestamptz
);

CREATE INDEX IF NOT EXISTS api_tokens_user_idx ON api_tokens(user_id);

ALTER TABLE api_tokens ENABLE ROW LEVEL SECURITY;

-- Владелец может делать со своими токенами что угодно (создать,
-- посмотреть список, отозвать) — единственная политика на эту
-- таблицу, тот же принцип, что у mock_endpoints/webhook_bins.
-- Создание и отзыв идут напрямую с клиента (обычная authenticated-
-- сессия, см. lib/hooks/useApiTokens.ts) — здесь не нужна отдельная
-- SECURITY DEFINER функция, в отличие от get_mock_route()/
-- ingest_webhook_request(), потому что тут ВСЕГДА есть auth.uid()
-- (владелец управляет своими токенами из настроек профиля, залогинен).
--
-- Проверка токена извне (по Bearer-заголовку в app/api/v1/mock-endpoints
-- и app/api/v1/webhook-bins) — другой случай: там нет Supabase-сессии
-- вообще, только сырая строка токена, поэтому та проверка идёт через
-- service-role клиент (lib/supabase/admin.ts), в обход RLS — та же
-- admin-логика, что уже используется для удаления аккаунта.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'api_tokens' AND policyname = 'api_tokens_own_row'
  ) THEN
    CREATE POLICY "api_tokens_own_row" ON api_tokens
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
