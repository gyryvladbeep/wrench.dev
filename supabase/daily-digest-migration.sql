-- ═══════════════════════════════════════════════════════
-- Миграция: Дневной дайджест (/digest)
-- ═══════════════════════════════════════════════════════
-- Выполнить ОДИН РАЗ в SQL Editor Supabase (Dashboard → SQL Editor →
-- New query → вставить и Run). Оба оператора идемпотентны (CREATE OR
-- REPLACE FUNCTION), безопасно выполнить повторно.
--
-- Дайджест не заводит ни одной новой таблицы — он целиком собирается
-- из того, что уже есть (challenges/daily_challenges/challenge_attempts/
-- user_streaks/profiles) плюс статических пулов шуток/фактов, которые
-- живут в коде (lib/digest-content.ts), не в базе. Ирония ротируется по
-- дню года на фронтенде — никакого крона, никакой генерации на лету.
--
-- Нужны только две SECURITY DEFINER функции — агрегаты, которые обычный
-- RLS-запрос отдать не может:

-- ── 1. Сколько человек уже решили сегодняшний челлендж по каждой роли ──
-- challenge_attempts закрыт RLS только на свои же строки (см.
-- challenges-schema.sql: "attempts_select" USING auth.uid() = user_id) —
-- это осознанно и не меняется здесь. Но агрегированное ЧИСЛО решивших,
-- без самих попыток и без личности решивших, ничего не раскрывает и
-- безопасно показать всем, как и число кто уже прошёл челлендж на
-- любой платформе с лидербордом.
CREATE OR REPLACE FUNCTION get_daily_solved_counts(p_date date DEFAULT CURRENT_DATE)
RETURNS TABLE(role challenge_role, solved_count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT dc.role, COUNT(*)::bigint
  FROM challenge_attempts ca
  JOIN daily_challenges dc ON dc.challenge_id = ca.challenge_id
  WHERE dc.scheduled_for = p_date AND ca.is_correct = true
  GROUP BY dc.role;
$$;

GRANT EXECUTE ON FUNCTION get_daily_solved_counts(date) TO anon, authenticated;

-- ── 2. Топ по текущему streak среди публичных профилей ("Зал славы") ──
-- user_streaks уже читаем для публичных профилей напрямую (RLS-политика
-- user_streaks_select_public из profile-public-migration.sql), но у
-- user_streaks нет foreign key на profiles (обе ссылаются на auth.users,
-- не друг на друга) — PostgREST не сможет сделать automatic embed вида
-- .select("profiles(...)") без явно объявленной связи. Функция делает
-- тот же join сама, одним запросом, без этой зависимости.
CREATE OR REPLACE FUNCTION get_streak_leaderboard(p_limit integer DEFAULT 5)
RETURNS TABLE(
  username        text,
  display_name    text,
  avatar_color    text,
  avatar_emblem   text,
  current_streak  integer,
  longest_streak  integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT p.username, p.display_name, p.avatar_color, p.avatar_emblem, s.current_streak, s.longest_streak
  FROM user_streaks s
  JOIN profiles p ON p.id = s.user_id
  WHERE p.is_public = true AND s.current_streak > 0
  ORDER BY s.current_streak DESC, s.longest_streak DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 20);
$$;

GRANT EXECUTE ON FUNCTION get_streak_leaderboard(integer) TO anon, authenticated;
