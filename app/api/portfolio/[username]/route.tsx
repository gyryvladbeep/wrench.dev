import { NextRequest, NextResponse } from "next/server";
import { ImageResponse } from "next/og";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { calcWrenchScore, getLevel } from "@/lib/wrench-score";
import { BADGES, Badge } from "@/lib/achievements";
import { getStackTag } from "@/lib/profile-stack";
import { getBannerGradient } from "@/lib/profile-banners";
import { ROLE_TAGS } from "@/lib/profile-roles";
import { ROLE_META, DIFFICULTY_META, ChallengeRole, ChallengeDifficulty } from "@/lib/challenges/types";
import { groupEndorsementsByTag, EndorsementRow } from "@/lib/skill-endorsements";
import { normalizePortfolioSections, orderedEnabledSections } from "@/lib/portfolio";

// ═══════════════════════════════════════════════════════════════
// Экспорт портфолио в PNG (Profile → Портфолио → Скачать PNG/PDF) —
// PDF на клиенте оборачивает эту же картинку через jsPDF (см. кнопку
// "Скачать PDF" в app/[locale]/profile/page.tsx), отдельного PDF-роута
// нет: серверный Puppeteer/Chromium на Vercel serverless — тяжёлая и
// хрупкая зависимость ради того же самого результата, который проще и
// надёжнее собрать из уже готовой картинки прямо в браузере.
//
// В отличие от /api/badge/[username] (публичный, анонимный, отдаёт
// маленький SVG-бейдж для чужого README) этот роут — ТОЛЬКО для
// владельца профиля и требует сессию: портфолио может включать разделы
// (закреплённые решения, награды), которые сам пользователь хочет
// собрать в файл ещё до того, как решит сделать профиль публичным, а
// открывать под это отдельную анонимную RLS-политику не нужно.
export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ username: string }>;
}

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 1500;

// Литералы вместо CSS-переменных из app/globals.css — Satori (на нём
// работает next/og ImageResponse) рендерит это дерево отдельно от
// страницы сайта и не видит ни один :root { --accent: ... }, поэтому
// значения продублированы буквально. При смене палитры сайта эти три
// константы тоже нужно поправить руками — см. тот же компромисс,
// описанный в components/portfolio/PortfolioPreview.tsx про два разных
// дерева для одного и того же контента.
const CANVAS   = "#0a0a10";
const SURFACE  = "#131319";
const BORDER   = "#232330";
const TEXT_PRIMARY   = "#f8f8fb";
const TEXT_SECONDARY = "#a4a4b1";
const TEXT_MUTED     = "#76767f";
const ACCENT   = "#f59e0b";

interface PinnedChallengeRow {
  id: string; title: string; title_ru: string | null;
  role: ChallengeRole; difficulty: ChallengeDifficulty; points: number;
}

function Chip({ children, color }: { children: string; color?: string }) {
  return (
    <div style={{
      display: "flex", padding: "6px 14px", borderRadius: 999,
      border: `1px solid ${color ? color + "40" : BORDER}`,
      background: color ? color + "15" : "transparent",
      color: color ?? TEXT_SECONDARY, fontSize: 22, marginRight: 10, marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

export async function GET(req: NextRequest, props: RouteParams) {
  const params = await props.params;
  const username = params.username;
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (profile.id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const sectionsParam = url.searchParams.get("sections");
  const enabledSections = sectionsParam
    ? normalizePortfolioSections(sectionsParam.split(","))
    : normalizePortfolioSections(profile.portfolio_sections);
  const sections = orderedEnabledSections(enabledSections);
  const sectionIds = new Set(sections.map((s) => s.id));

  const [{ data: streak }, { count: toolsUsed }, { data: earnedRows }, pinnedResult, endorsementResult] = await Promise.all([
    supabase.from("user_streaks").select("total_points, total_solved, current_streak, longest_streak").eq("user_id", user.id).single(),
    supabase.from("tool_history").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("achievements").select("badge_id").eq("user_id", user.id),
    profile.pinned_challenge_ids?.length && sectionIds.has("pinned_challenges")
      ? supabase.from("challenges").select("id, title, title_ru, role, difficulty, points").in("id", profile.pinned_challenge_ids)
      : Promise.resolve({ data: [] as PinnedChallengeRow[] }),
    sectionIds.has("endorsements")
      ? supabase.from("skill_endorsements").select("skill_tag, endorser_id").eq("endorsee_id", user.id)
      : Promise.resolve({ data: [] as EndorsementRow[] }),
  ]);

  const score = calcWrenchScore({
    total_points:   streak?.total_points   ?? 0,
    total_solved:   streak?.total_solved   ?? 0,
    current_streak: streak?.current_streak ?? 0,
    longest_streak: streak?.longest_streak ?? 0,
    tools_used:     toolsUsed ?? 0,
    badges_count:   (earnedRows ?? []).length,
  });
  const level = getLevel(score);

  const earnedBadgeIds = (earnedRows ?? []).map((r: { badge_id: string }) => r.badge_id);
  const badges = earnedBadgeIds.map((id: string) => BADGES.find((b: Badge) => b.id === id)).filter((b: Badge | undefined): b is Badge => Boolean(b));

  const pinnedRows = (pinnedResult.data ?? []) as PinnedChallengeRow[];
  const pinnedMap  = new Map(pinnedRows.map((c) => [c.id, c]));
  const pinnedChallenges = (profile.pinned_challenge_ids ?? [])
    .map((id: string) => pinnedMap.get(id))
    .filter((c: PinnedChallengeRow | undefined): c is PinnedChallengeRow => Boolean(c));

  const topEndorsedTags = Array.from(groupEndorsementsByTag((endorsementResult.data ?? []) as EndorsementRow[]).entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3)
    .map(([tag, rows]) => ({ tag: getStackTag(tag), count: rows.length }))
    .filter((t): t is { tag: NonNullable<ReturnType<typeof getStackTag>>; count: number } => Boolean(t.tag));

  const role = ROLE_TAGS.find((r) => r.id === profile.role_tag);
  const banner = getBannerGradient(profile.banner_gradient);
  const stackTags = (profile.tech_stack as string[]).map(getStackTag).filter((t): t is NonNullable<typeof t> => Boolean(t));
  const initials = (profile.display_name || profile.username || "?")[0].toUpperCase();

  return new ImageResponse(
    (
      <div style={{
        display: "flex", flexDirection: "column", width: CARD_WIDTH, height: CARD_HEIGHT,
        background: CANVAS, fontFamily: "sans-serif",
      }}>
        {/* Баннер */}
        <div style={{ display: "flex", width: "100%", height: 140, background: banner?.css ?? ACCENT }} />

        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "0 64px 48px 64px" }}>
          {/* Аватар */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 130, height: 130, borderRadius: "50%", marginTop: -65,
            background: profile.avatar_color, border: `6px solid ${CANVAS}`,
            fontSize: 52, fontWeight: 700, color: CANVAS,
          }}>
            {initials}
          </div>

          <div style={{ display: "flex", fontSize: 44, fontWeight: 700, color: TEXT_PRIMARY, marginTop: 24 }}>
            {profile.display_name || `@${profile.username}`}
          </div>
          <div style={{ display: "flex", fontSize: 24, color: TEXT_MUTED, marginTop: 8 }}>
            {[`@${profile.username}`, role ? role.labelRu : null, profile.location].filter(Boolean).join("  ·  ")}
          </div>

          {sections.map((section) => {
            if (section.id === "tagline" && profile.tagline) {
              return <div key="tagline" style={{ display: "flex", fontSize: 28, fontWeight: 600, color: ACCENT, marginTop: 28 }}>{profile.tagline}</div>;
            }
            if (section.id === "bio" && profile.bio) {
              return <div key="bio" style={{ display: "flex", fontSize: 24, color: TEXT_SECONDARY, marginTop: 16, lineHeight: 1.4 }}>{profile.bio}</div>;
            }
            if (section.id === "links") {
              const links = [profile.github_url && "GitHub", profile.linkedin_url && "LinkedIn", profile.website_url && "Website"].filter(Boolean) as string[];
              return links.length > 0 ? (
                <div key="links" style={{ display: "flex", flexWrap: "wrap", marginTop: 24 }}>
                  {links.map((l) => <Chip key={l}>{l}</Chip>)}
                </div>
              ) : null;
            }
            if (section.id === "tech_stack" && stackTags.length > 0) {
              return (
                <div key="tech_stack" style={{ display: "flex", flexWrap: "wrap", marginTop: 24 }}>
                  {stackTags.map((t) => <Chip key={t.id} color={ACCENT}>{t.labelRu}</Chip>)}
                </div>
              );
            }
            if (section.id === "score") {
              return (
                <div key="score" style={{
                  display: "flex", alignItems: "center", marginTop: 28, padding: "18px 26px",
                  borderRadius: 14, border: `1px solid ${level.color}40`, background: `${level.color}15`,
                }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: level.color }}>{level.labelRu}</div>
                    <div style={{ display: "flex", fontSize: 20, color: TEXT_MUTED, marginTop: 4 }}>{score} pts · Wrench Score</div>
                  </div>
                </div>
              );
            }
            if (section.id === "badges" && badges.length > 0) {
              return (
                <div key="badges" style={{ display: "flex", flexDirection: "column", marginTop: 28 }}>
                  <div style={{ display: "flex", fontSize: 18, letterSpacing: 1, textTransform: "uppercase", color: TEXT_MUTED, marginBottom: 10 }}>
                    Награды · {badges.length}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {badges.slice(0, 8).map((b: Badge) => <Chip key={b.id} color={ACCENT}>{b.labelRu}</Chip>)}
                  </div>
                </div>
              );
            }
            if (section.id === "pinned_challenges" && pinnedChallenges.length > 0) {
              return (
                <div key="pinned_challenges" style={{ display: "flex", flexDirection: "column", marginTop: 28 }}>
                  <div style={{ display: "flex", fontSize: 18, letterSpacing: 1, textTransform: "uppercase", color: TEXT_MUTED, marginBottom: 10 }}>
                    Закреплённые решения
                  </div>
                  {pinnedChallenges.slice(0, 4).map((c: PinnedChallengeRow) => (
                    <div key={c.id} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "14px 20px", borderRadius: 10, border: `1px solid ${BORDER}`, background: SURFACE, marginBottom: 10,
                    }}>
                      <div style={{ display: "flex", fontSize: 22, color: TEXT_PRIMARY }}>{c.title_ru || c.title}</div>
                      <div style={{ display: "flex", fontSize: 18, color: TEXT_MUTED }}>
                        {ROLE_META[c.role].labelRu} · {DIFFICULTY_META[c.difficulty].labelRu} · +{c.points}
                      </div>
                    </div>
                  ))}
                </div>
              );
            }
            if (section.id === "endorsements" && topEndorsedTags.length > 0) {
              return (
                <div key="endorsements" style={{ display: "flex", flexDirection: "column", marginTop: 28 }}>
                  <div style={{ display: "flex", fontSize: 18, letterSpacing: 1, textTransform: "uppercase", color: TEXT_MUTED, marginBottom: 10 }}>
                    Эндорсементы навыков
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {topEndorsedTags.map(({ tag, count }) => <Chip key={tag.id}>{`${tag.labelRu} · ${count}`}</Chip>)}
                  </div>
                </div>
              );
            }
            return null;
          })}

          {/* Футер-брендинг — прижат к низу карточки фиксированной
              высоты (marginTop: "auto" внутри flex-column), чтобы он
              был на одном и том же месте независимо от того, сколько
              разделов включено выше. */}
          <div style={{
            display: "flex", justifyContent: "center", marginTop: "auto", paddingTop: 32,
            borderTop: `1px solid ${BORDER}`, fontSize: 18, color: TEXT_MUTED, letterSpacing: 1,
          }}>
            wrench-branch.vercel.app
          </div>
        </div>
      </div>
    ),
    { width: CARD_WIDTH, height: CARD_HEIGHT }
  );
}
