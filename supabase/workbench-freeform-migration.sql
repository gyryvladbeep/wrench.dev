-- ═══════════════════════════════════════════════════════
-- Миграция: свободный холст + публичный шаринг для Workbench
-- ═══════════════════════════════════════════════════════
-- Этот файл нужно выполнить ОДИН РАЗ в SQL Editor твоего живого проекта
-- Supabase (Dashboard → SQL Editor → New query → вставить и Run).
--
-- workbench-schema.sql описывает таблицу с нуля (для нового проекта) и
-- теперь уже включает layout/is_public — но твоя таблица workbenches
-- уже существует и создана раньше, поэтому CREATE TABLE IF NOT EXISTS
-- там ничего не изменит в уже существующей таблице. Этот файл — именно
-- та миграция, которая довносит недостающие колонки и политику в БД,
-- которая уже работает в проде. Все операторы идемпотентны (IF NOT
-- EXISTS) — безопасно выполнить даже повторно, если что-то пошло не так
-- с середины.

ALTER TABLE workbenches ADD COLUMN IF NOT EXISTS layout jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE workbenches ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

-- CREATE POLICY не поддерживает IF NOT EXISTS — оборачиваем в DO-блок,
-- чтобы повторный запуск миграции не падал с "policy already exists".
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'workbenches' AND policyname = 'workbenches_select_public'
  ) THEN
    CREATE POLICY "workbenches_select_public" ON workbenches FOR SELECT USING (is_public = true);
  END IF;
END $$;
