-- ═══════════════════════════════════════════════════════
-- Миграция: публичная статистика для соц-proof на главной
-- ═══════════════════════════════════════════════════════
-- Выполнить ОДИН РАЗ в SQL Editor Supabase (Dashboard → SQL Editor →
-- New query → вставить и Run). CREATE OR REPLACE FUNCTION — идемпотентно,
-- безопасно выполнить повторно.
--
-- Тот же паттерн, что уже используется в daily-digest-migration.sql
-- (get_daily_solved_counts, get_streak_leaderboard) — SECURITY DEFINER
-- функция для агрегата, который обычный RLS-запрос отдать не может:
-- profiles и challenge_attempts закрыты построчно (RLS отдаёт анонимному
-- запросу только свои же строки, см. "attempts_select" в
-- challenges-schema.sql), но ОБЩЕЕ число, без единой личности или
-- попытки, ничего не раскрывает и безопасно показать всем.
--
-- Главная страница показывает эти цифры только выше определённого
-- порога (см. app/[locale]/page.tsx) — маленькое число сейчас работало
-- бы против доверия, а не на него.
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS TABLE(total_users bigint, total_challenges_solved bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    (SELECT COUNT(*) FROM profiles)::bigint,
    (SELECT COUNT(*) FROM challenge_attempts WHERE is_correct = true)::bigint;
$$;

GRANT EXECUTE ON FUNCTION get_platform_stats() TO anon, authenticated;
