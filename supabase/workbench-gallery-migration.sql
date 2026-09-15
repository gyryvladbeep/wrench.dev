-- ═══════════════════════════════════════════════════════
-- Миграция: публичная галерея Workbench + клонирование
-- ═══════════════════════════════════════════════════════
-- Выполнить ОДИН РАЗ в SQL Editor Supabase (Dashboard → SQL Editor →
-- New query → вставить и Run) — тот же процесс, что и для остальных
-- миграций (workbench-freeform-migration.sql, profile-public-migration.sql
-- и т.д.). Все операторы идемпотентны (IF NOT EXISTS / CREATE OR REPLACE /
-- DO-блоки), безопасно выполнить повторно.

-- description — необязательная короткая подпись, которую автор сам
-- пишет для публичной ссылки (зачем этот набор инструментов, для какой
-- задачи он собран) — то, чего раньше не было вообще: публичная
-- страница показывала только name. Не NOT NULL — у существующих
-- workbench'ей её просто нет, и это нормальное состояние, а не пробел,
-- который нужно чем-то заполнить.
--
-- clone_count — сколько раз этот workbench скопировали себе через
-- галерею. Отдельная колонка, а не COUNT(*) по какой-то таблице копий,
-- потому что копия не хранит, от кого она склонирована (в этом нет
-- ценности для самого пользователя-клонировщика, а хранить это было бы
-- лишней связью ради одной лишь метрики популярности у оригинала).
ALTER TABLE workbenches ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE workbenches ADD COLUMN IF NOT EXISTS clone_count integer NOT NULL DEFAULT 0;

-- Частичный индекс — под запрос самой галереи (только публичные строки,
-- отсортированные по популярности, затем по свежести). WHERE is_public
-- = true держит индекс маленьким: приватные workbenches (подавляющее
-- большинство, is_public по умолчанию false) в него вообще не попадают.
CREATE INDEX IF NOT EXISTS idx_workbenches_gallery
  ON workbenches (clone_count DESC, created_at DESC)
  WHERE is_public = true;

-- Инкремент clone_count по чужому (публичному) workbench не может пройти
-- через обычный UPDATE — политика workbenches_update разрешает менять
-- только свои собственные строки (auth.uid() = user_id), и это правильно:
-- ослаблять её ради одной колонки означало бы разрешить анонимному или
-- чужому пользователю переписывать name/tool_slugs/layout чужого стола.
-- Тот же приём, что уже применён для mock-api (get_mock_route) и зарплат
-- (salary-calculator-migration.sql) — узкая SECURITY DEFINER функция,
-- которая трогает ровно одну колонку и только у строки с is_public =
-- true, ничего похожего на "обнови любой workbench по id" через неё
-- получить нельзя.
CREATE OR REPLACE FUNCTION increment_workbench_clone_count(p_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE workbenches
  SET clone_count = clone_count + 1
  WHERE id = p_id AND is_public = true;
$$;

GRANT EXECUTE ON FUNCTION increment_workbench_clone_count(uuid) TO anon, authenticated;
