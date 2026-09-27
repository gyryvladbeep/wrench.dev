-- ═══════════════════════════════════════════════════════
-- Test Vault — личная база закреплённых тест-кейсов
-- ═══════════════════════════════════════════════════════
-- На любом из подключённых инструментов (JSON Formatter, JWT Decoder,
-- Regex Tester — см. components/tools/*) появляется кнопка "закрепить
-- как тест-кейс", которая сохраняет ввод + результат + метку сюда.
-- Вся идея фичи в том, что она накапливается со временем и превращает
-- разовые конвертеры в личную библиотеку edge-кейсов — MVP без re-run
-- и экспорта, просто хранение + список (см. lib/hooks/usePinnedCases.ts).
--
-- Как и favorites (см. favorites-schema.sql), фича работает без
-- аккаунта через localStorage — эта таблица становится источником
-- истины только после входа, а анонимные закрепления переносятся в
-- аккаунт один раз при первом входе.

CREATE TABLE IF NOT EXISTS pinned_cases (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_slug        text NOT NULL,
  label            text NOT NULL DEFAULT '',
  input_payload    jsonb NOT NULL,
  expected_output  jsonb NOT NULL DEFAULT 'null'::jsonb,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pinned_cases ENABLE ROW LEVEL SECURITY;

-- Только select/insert/delete — MVP не даёт редактировать закреплённый
-- кейс "на месте" (нет update policy), только пересоздать заново.
CREATE POLICY "pinned_cases_select" ON pinned_cases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "pinned_cases_insert" ON pinned_cases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pinned_cases_delete" ON pinned_cases FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_pinned_cases_user ON pinned_cases(user_id);
CREATE INDEX IF NOT EXISTS idx_pinned_cases_user_tool ON pinned_cases(user_id, tool_slug);
