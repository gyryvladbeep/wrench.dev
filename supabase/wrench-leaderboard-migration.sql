-- ═══════════════════════════════════════════════════════
-- Миграция: публичный лидерборд Wrench Score (/leaderboard)
-- ═══════════════════════════════════════════════════════
-- Выполнить ОДИН РАЗ в SQL Editor Supabase (Dashboard → SQL Editor →
-- New query → вставить и Run) — тот же процесс, что и у остальных
-- миграций в этой папке. Идемпотентно (CREATE OR REPLACE), безопасно
-- выполнить повторно.

-- Тот же приём, что уже у get_streak_leaderboard() и get_platform_stats()
-- (supabase/daily-digest-migration.sql, supabase/platform-stats-migration.sql):
-- SECURITY DEFINER — потому что реальное ранжирование требует читать
-- user_streaks/tool_history/achievements по ВСЕМ публичным профилям
-- разом, а обычный RLS-запрос отдаёт анонимному посетителю только его
-- собственные строки в этих трёх таблицах. Формула ниже — буквально
-- calcWrenchScore() из lib/wrench-score.ts, продублированная в SQL: это
-- единственный способ отсортировать ПО очкам в самой базе (посчитать
-- очки на клиенте для каждого из тысяч профилей и сортировать в JS не
-- масштабируется, ровно та же причина, по которой лента на /people
-- сознательно не претендует на роль лидерборда — см. комментарий в
-- components/PeopleDirectory.tsx).
--
-- В отличие от get_streak_leaderboard() (только стрик, для дайджеста),
-- эта функция — полноценный, независимо проверяемый рейтинг для
-- отдельной индексируемой страницы /leaderboard, не просто срез.
CREATE OR REPLACE FUNCTION get_wrench_score_leaderboard(p_limit integer DEFAULT 50)
RETURNS TABLE(
  username        text,
  display_name    text,
  avatar_color    text,
  avatar_emblem   text,
  tagline         text,
  wrench_score    integer,
  total_solved    integer,
  current_streak  integer,
  longest_streak  integer,
  tools_used      integer,
  badges_count    integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  WITH tool_counts AS (
    SELECT user_id, COUNT(*)::integer AS cnt FROM tool_history GROUP BY user_id
  ), badge_counts AS (
    SELECT user_id, COUNT(*)::integer AS cnt FROM achievements GROUP BY user_id
  )
  SELECT
    p.username,
    p.display_name,
    p.avatar_color,
    p.avatar_emblem,
    p.tagline,
    (
      COALESCE(s.total_points, 0)
      + COALESCE(s.total_solved, 0) * 2
      + COALESCE(s.current_streak, 0) * 5
      + COALESCE(s.longest_streak, 0) * 2
      + LEAST(COALESCE(tc.cnt, 0), 100) * 1
      + COALESCE(bc.cnt, 0) * 20
    )::integer AS wrench_score,
    COALESCE(s.total_solved, 0)::integer,
    COALESCE(s.current_streak, 0)::integer,
    COALESCE(s.longest_streak, 0)::integer,
    COALESCE(tc.cnt, 0)::integer,
    COALESCE(bc.cnt, 0)::integer
  FROM profiles p
  LEFT JOIN user_streaks s   ON s.user_id  = p.id
  LEFT JOIN tool_counts  tc  ON tc.user_id = p.id
  LEFT JOIN badge_counts bc  ON bc.user_id = p.id
  WHERE p.is_public = true
  -- Ноль очков всё равно технически валидный ряд (только что
  -- зарегистрировался, но включил публичность) — не фильтруем по
  -- wrench_score > 0 здесь, потому что "показывать только тех, у кого
  -- есть хоть какой-то счёт" — решение страницы, не самой функции;
  -- ORDER BY уже уводит их в самый конец списка LIMIT p_limit.
  ORDER BY wrench_score DESC, p.username ASC
  LIMIT LEAST(GREATEST(p_limit, 1), 100);
$$;

GRANT EXECUTE ON FUNCTION get_wrench_score_leaderboard(integer) TO anon, authenticated;
