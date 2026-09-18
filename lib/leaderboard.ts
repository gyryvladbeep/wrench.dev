// ═══════════════════════════════════════════════════════════════
// Общий тип строки лидерборда — используется и серверной страницей
// (app/[locale]/leaderboard/page.tsx, которая делает supabase.rpc()) и
// презентационным LeaderboardTable.tsx (который его только рисует), тем
// же приёмом, что уже разносит TrainerProgressRow/LatestWorkbenchRow в
// lib/continue-widget.ts между запросом и компонентом. Поля — 1:1 с
// RETURNS TABLE(...) в supabase/wrench-leaderboard-migration.sql
// (get_wrench_score_leaderboard).
// ═══════════════════════════════════════════════════════════════

export interface LeaderboardEntry {
  username:        string;
  display_name:    string | null;
  avatar_color:     string;
  avatar_emblem:    string | null;
  tagline:          string | null;
  wrench_score:     number;
  total_solved:     number;
  current_streak:   number;
  longest_streak:   number;
  tools_used:       number;
  badges_count:     number;
}

export const LEADERBOARD_SIZE = 50;
