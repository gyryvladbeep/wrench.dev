import { NextRequest, NextResponse } from "next/server";
import { makeBadge } from "badge-maker";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { calcWrenchScore, getLevel } from "@/lib/wrench-score";
import { checkAchievements } from "@/lib/achievements";
import { EndorsementRow, countDistinctEndorsers, countDistinctEndorsedSkills } from "@/lib/skill-endorsements";

// Публичный, полностью анонимный эндпоинт — отдаёт SVG-бейдж с Wrench
// Score для вставки в чужой GitHub README (<img src=".../api/badge/username">
// или markdown-ссылка, см. блок "Бейдж для README" в настройках профиля).
// Единственная проверка доступа — та же, что уже используется на
// /u/[username] (см. PublicProfileView.tsx): профиль ищется по username
// через обычный анонимный supabase-клиент, и RLS-политика
// profiles_select_public (supabase/profile-public-migration.sql) отдаёт
// строку, только если is_public = true. Приватный и несуществующий
// username отсюда неотличимы — та же самая причина, что и на публичной
// странице профиля: не палить текстом ошибки сам факт существования
// username в базе.
export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ username: string }>;
}

const SVG_HEADERS = {
  "Content-Type": "image/svg+xml; charset=utf-8",
  // GitHub сам кеширует картинки из README через свой camo-прокси, так
  // что реальные просмотры чужого README почти не доходят досюда — но
  // прямой просмотр URL бейджа (отладка, ручной рефреш) не должен долбить
  // Supabase на каждый запрос, поэтому свой короткий кеш тоже выставляем.
  "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
} as const;

function fallbackBadge(message: string) {
  return makeBadge({ label: "wrench score", message, color: "lightgrey", labelColor: "#18181b", style: "flat" });
}

export async function GET(_req: NextRequest, props: RouteParams) {
  const params = await props.params;
  const username = params.username;
  const supabase = await createServerSupabaseClient();

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .single();

    if (!profile) {
      return new NextResponse(fallbackBadge("user not found"), { headers: SVG_HEADERS });
    }

    const { data: streak } = await supabase
      .from("user_streaks")
      .select("total_points, total_solved, current_streak, longest_streak")
      .eq("user_id", profile.id)
      .single();

    if (!streak) {
      return new NextResponse(fallbackBadge("user not found"), { headers: SVG_HEADERS });
    }

    const { count: toolsUsed } = await supabase
      .from("tool_history")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id);

    // Публично читаемо — тот же RLS (skill_endorsements_select_public), что
    // и на публичной странице профиля. roadmap item 1 (Skill-badges 2.0).
    const { data: endorseRows } = await supabase
      .from("skill_endorsements")
      .select("skill_tag, endorser_id")
      .eq("endorsee_id", profile.id);

    // badges_count считается той же чистой функцией, что и на публичной
    // странице профиля (PublicProfileView.tsx) — из streak-статистики,
    // без отдельного запроса к таблице achievements.
    const badgesCount = checkAchievements({
      total_solved: streak.total_solved ?? 0,
      total_points: streak.total_points ?? 0,
      current_streak: streak.current_streak ?? 0,
      isPro: false,
      endorsed_by_count: countDistinctEndorsers((endorseRows as EndorsementRow[]) ?? []),
      endorsed_skills_count: countDistinctEndorsedSkills((endorseRows as EndorsementRow[]) ?? []),
    }).length;

    const score = calcWrenchScore({
      total_points: streak.total_points ?? 0,
      total_solved: streak.total_solved ?? 0,
      current_streak: streak.current_streak ?? 0,
      longest_streak: streak.longest_streak ?? 0,
      tools_used: toolsUsed ?? 0,
      badges_count: badgesCount,
    });
    const level = getLevel(score);

    const svg = makeBadge({
      label: "wrench score",
      message: `${score} · ${level.label}`,
      color: level.color,
      labelColor: "#18181b",
      style: "flat",
    });

    return new NextResponse(svg, { headers: SVG_HEADERS });
  } catch {
    // .from() отсутствует у заглушки createServerSupabaseClient(), которая
    // отдаётся, когда переменные окружения Supabase не заданы (см. её же
    // комментарий в lib/supabase/server.ts) — в такой среде сервис бейджей
    // недоступен целиком, но валидная SVG-картинка всё равно лучше
    // сломанного <img> в чужом README, поэтому статус остаётся 200.
    return new NextResponse(fallbackBadge("unavailable"), { headers: SVG_HEADERS });
  }
}
