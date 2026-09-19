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
import {
  normalizePortfolioSections, orderedEnabledSections, resolvePortfolioText,
  getPortfolioTheme, themeSectionLabel, PortfolioExperienceEntry, PortfolioProjectEntry,
} from "@/lib/portfolio";

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
// (закреплённые решения, награды, опыт работы), которые сам пользователь
// хочет собрать в файл ещё до того, как решит сделать профиль публичным,
// а открывать под это отдельную анонимную RLS-политику не нужно.
//
// Тема оформления (fantasy/space/matrix/...) влияет здесь только на
// палитру, обводку, радиус углов и угловой символ — НЕ на шрифт. Satori
// (движок next/og ImageResponse) рисует текст только теми шрифтами, чьи
// файлы ему явно передали байтами через опцию fonts, а не по названию
// семейства из style.fontFamily; грузить десяток Google Fonts на каждый
// запрос — лишняя сетевая зависимость serverless-функции ради разницы,
// которая на статичном постере всё равно менее заметна, чем в
// интерактивном превью (там это обычный <link>, см.
// PortfolioPreview.tsx). Если платный шрифт на экспорте станет важен —
// можно позже подгрузить .ttf через fs.readFile из /public и передать в
// ImageResponse({ fonts: [...] }), но это отдельная задача.
export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ username: string }>;
}

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 1600;

interface PinnedChallengeRow {
  id: string; title: string; title_ru: string | null;
  role: ChallengeRole; difficulty: ChallengeDifficulty; points: number;
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

  const themeParam = url.searchParams.get("theme");
  const theme = getPortfolioTheme(themeParam || profile.portfolio_theme);
  const label = (id: string) => {
    const meta = sections.find((s) => s.id === id);
    return meta ? themeSectionLabel(theme.id, meta, true) : "";
  };

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
  const experience = ((profile.portfolio_experience ?? []) as PortfolioExperienceEntry[]).slice(0, 4);
  const projects   = ((profile.portfolio_projects ?? [])   as PortfolioProjectEntry[]).slice(0, 4);

  // Ручной редактор (Profile → Портфолио) — те же переопределения и та же
  // resolvePortfolioText(), что и в живом предпросмотре
  // (components/portfolio/PortfolioPreview.tsx), чтобы экспорт никогда не
  // мог показать текст, которого не было в предпросмотре.
  const title   = resolvePortfolioText(profile.portfolio_title, profile.display_name || `@${profile.username}`);
  const tagline = resolvePortfolioText(profile.portfolio_tagline, profile.tagline ?? "");
  const bio     = resolvePortfolioText(profile.portfolio_bio, profile.bio ?? "");
  const footer  = resolvePortfolioText(profile.portfolio_footer, "wrench-branch.vercel.app");
  const showBanner = sectionIds.has("banner");
  const showAvatar = sectionIds.has("avatar");

  function Chip({ children, filled }: { children: string; filled?: boolean }) {
    return (
      <div style={{
        display: "flex", padding: "6px 14px", borderRadius: Math.min(theme.radius + 6, 999),
        border: `1px solid ${filled ? theme.accent + "40" : theme.border}`,
        background: filled ? theme.accent + "15" : "transparent",
        color: filled ? theme.accent : theme.textSecondary, fontSize: 22, marginRight: 10, marginBottom: 10,
      }}>
        {children}
      </div>
    );
  }

  function SectionHeading({ children }: { children: string }) {
    return (
      <div style={{ display: "flex", fontSize: 18, letterSpacing: 1, textTransform: "uppercase", color: theme.textMuted, marginBottom: 10 }}>
        {children}
      </div>
    );
  }

  return new ImageResponse(
    (
      <div style={{
        display: "flex", flexDirection: "column", width: CARD_WIDTH, height: CARD_HEIGHT,
        background: theme.bg, fontFamily: "sans-serif", position: "relative",
        border: `2px solid ${theme.border}`,
      }}>
        {/* Угловой символ темы — один и тот же текстовый глиф в двух
            верхних углах, самый дешёвый способ дать карточке узнаваемую
            деталь без SVG/иконок, которые Satori рисует не всегда
            предсказуемо. Пустая строка (classic/minimal) — просто ничего
            не рендерим. */}
        {theme.cornerGlyph && (
          <>
            <div style={{ display: "flex", position: "absolute", top: 28, left: 28, fontSize: 30, color: theme.accent }}>{theme.cornerGlyph}</div>
            <div style={{ display: "flex", position: "absolute", top: 28, right: 28, fontSize: 30, color: theme.accent }}>{theme.cornerGlyph}</div>
          </>
        )}

        {/* Баннер — переключаемый раздел, как и всё остальное (см.
            комментарий у PORTFOLIO_SECTIONS в lib/portfolio.ts). */}
        {showBanner && <div style={{ display: "flex", width: "100%", height: 140, background: banner?.css ?? theme.accent }} />}

        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: `${showBanner ? 0 : 64}px 64px 48px 64px` }}>
          {/* Аватар — тоже переключаемый; без баннера сверху инициалу
              незачем наезжать отрицательным отступом на пустое место. */}
          {showAvatar && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 130, height: 130, borderRadius: "50%", marginTop: showBanner ? -65 : 0,
              background: profile.avatar_color, border: `6px solid ${theme.bg}`,
              fontSize: 52, fontWeight: 700, color: theme.bg,
            }}>
              {initials}
            </div>
          )}

          <div style={{ display: "flex", fontSize: 44, fontWeight: 700, color: theme.textPrimary, marginTop: 24 }}>
            {title}
          </div>
          <div style={{ display: "flex", fontSize: 24, color: theme.textMuted, marginTop: 8 }}>
            {[`@${profile.username}`, role ? role.labelRu : null, profile.location].filter(Boolean).join("  ·  ")}
          </div>

          {sections.map((section) => {
            if (section.id === "tagline" && tagline) {
              return <div key="tagline" style={{ display: "flex", fontSize: 28, fontWeight: 600, color: theme.accent, marginTop: 28 }}>{tagline}</div>;
            }
            if (section.id === "bio" && bio) {
              return <div key="bio" style={{ display: "flex", fontSize: 24, color: theme.textSecondary, marginTop: 16, lineHeight: 1.4 }}>{bio}</div>;
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
                <div key="tech_stack" style={{ display: "flex", flexDirection: "column", marginTop: 28 }}>
                  <SectionHeading>{label("tech_stack")}</SectionHeading>
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {stackTags.map((t) => <Chip key={t.id} filled>{t.labelRu}</Chip>)}
                  </div>
                </div>
              );
            }
            if (section.id === "experience" && experience.length > 0) {
              return (
                <div key="experience" style={{ display: "flex", flexDirection: "column", marginTop: 28 }}>
                  <SectionHeading>{label("experience")}</SectionHeading>
                  {experience.map((e) => (
                    <div key={e.id} style={{
                      display: "flex", flexDirection: "column", padding: "16px 20px", borderRadius: theme.radius,
                      border: `1px solid ${theme.border}`, background: theme.surface, marginBottom: 10,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: theme.textPrimary, fontWeight: 700 }}>
                        <span>{e.position}{e.company ? ` · ${e.company}` : ""}</span>
                        <span style={{ display: "flex", fontSize: 17, color: theme.textMuted, fontWeight: 400 }}>{e.period}</span>
                      </div>
                      {e.description && (
                        <div style={{ display: "flex", fontSize: 18, color: theme.textSecondary, marginTop: 6, lineHeight: 1.4 }}>{e.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              );
            }
            if (section.id === "projects" && projects.length > 0) {
              return (
                <div key="projects" style={{ display: "flex", flexDirection: "column", marginTop: 28 }}>
                  <SectionHeading>{label("projects")}</SectionHeading>
                  {projects.map((p) => (
                    <div key={p.id} style={{
                      display: "flex", flexDirection: "column", padding: "16px 20px", borderRadius: theme.radius,
                      border: `1px solid ${theme.border}`, background: theme.surface, marginBottom: 10,
                    }}>
                      <div style={{ display: "flex", fontSize: 22, color: theme.textPrimary, fontWeight: 700 }}>{p.name}</div>
                      {p.description && (
                        <div style={{ display: "flex", fontSize: 18, color: theme.textSecondary, marginTop: 4, lineHeight: 1.4 }}>{p.description}</div>
                      )}
                      {p.tech && (
                        <div style={{ display: "flex", fontSize: 16, color: theme.accent, marginTop: 6 }}>{p.tech}</div>
                      )}
                    </div>
                  ))}
                </div>
              );
            }
            if (section.id === "score") {
              return (
                <div key="score" style={{
                  display: "flex", alignItems: "center", marginTop: 28, padding: "18px 26px",
                  borderRadius: theme.radius, border: `1px solid ${level.color}40`, background: `${level.color}15`,
                }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: level.color }}>{level.labelRu}</div>
                    <div style={{ display: "flex", fontSize: 20, color: theme.textMuted, marginTop: 4 }}>{score} pts · {label("score")}</div>
                  </div>
                </div>
              );
            }
            if (section.id === "badges" && badges.length > 0) {
              return (
                <div key="badges" style={{ display: "flex", flexDirection: "column", marginTop: 28 }}>
                  <SectionHeading>{`${label("badges")} · ${badges.length}`}</SectionHeading>
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {badges.slice(0, 8).map((b: Badge) => <Chip key={b.id} filled>{b.labelRu}</Chip>)}
                  </div>
                </div>
              );
            }
            if (section.id === "pinned_challenges" && pinnedChallenges.length > 0) {
              return (
                <div key="pinned_challenges" style={{ display: "flex", flexDirection: "column", marginTop: 28 }}>
                  <SectionHeading>{label("pinned_challenges")}</SectionHeading>
                  {pinnedChallenges.slice(0, 4).map((c: PinnedChallengeRow) => (
                    <div key={c.id} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "14px 20px", borderRadius: theme.radius, border: `1px solid ${theme.border}`, background: theme.surface, marginBottom: 10,
                    }}>
                      <div style={{ display: "flex", fontSize: 22, color: theme.textPrimary }}>{c.title_ru || c.title}</div>
                      <div style={{ display: "flex", fontSize: 18, color: theme.textMuted }}>
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
                  <SectionHeading>{label("endorsements")}</SectionHeading>
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
            borderTop: `1px solid ${theme.border}`, fontSize: 18, color: theme.textMuted, letterSpacing: 1,
          }}>
            {footer}
          </div>
        </div>
      </div>
    ),
    { width: CARD_WIDTH, height: CARD_HEIGHT }
  );
}
