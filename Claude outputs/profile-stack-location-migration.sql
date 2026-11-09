-- ═══════════════════════════════════════════════════════
-- Миграция: стек и локация в директории специалистов (/people)
-- ═══════════════════════════════════════════════════════
-- Выполнить ОДИН РАЗ в SQL Editor Supabase (Dashboard → SQL Editor →
-- New query → вставить и Run) — тот же процесс, что и у
-- supabase/profile-public-migration.sql. Все операторы идемпотентны
-- (IF NOT EXISTS), безопасно выполнить повторно.

-- tech_stack — фиксированный набор тегов из lib/profile-stack.ts (их id
-- строкой, не свободный текст), тот же принцип, что уже применён к
-- role_tag: конечный справочник проще отрисовать чипами в Settings и
-- проще фильтровать в директории (lib/profile-directory.ts), чем
-- разбирать произвольные строки, которые каждый напишет по-своему.
--
-- location — наоборот, свободный текст ("Berlin", "Алматы", "Remote").
-- В отличие от стека тут нет закрытого справочника городов/стран —
-- вводить готовый список означало бы либо неполный охват, либо отдельную
-- задачу на геокодинг, которая не стоит того ради простого текстового
-- фильтра на клиенте (ilike, см. searchProfiles).
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tech_stack text[] NOT NULL DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location    text;

-- GIN-индекс под оператор @> (contains), которым searchProfiles()
-- фильтрует "показать всех с тегом X" — без него каждый такой запрос
-- был бы последовательным сканированием всей таблицы profiles.
CREATE INDEX IF NOT EXISTS idx_profiles_tech_stack ON profiles USING GIN (tech_stack);

-- profiles_select_public (is_public = true, см.
-- supabase/profile-public-migration.sql) уже покрывает ЛЮБую колонку
-- этой строки, включая обе новые — отдельной политики для tech_stack/
-- location не нужно, RLS работает на уровне строк, не колонок (тот же
-- факт уже отмечен комментарием в profile-public-migration.sql).
