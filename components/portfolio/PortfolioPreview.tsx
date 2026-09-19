"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Locale } from "@/lib/i18n/config";
import { getStackTag } from "@/lib/profile-stack";
import { BADGES, BADGE_COLOR } from "@/lib/achievements";
import { WrenchLevel } from "@/lib/wrench-score";
import { ROLE_META, DIFFICULTY_META, ChallengeRole, ChallengeDifficulty } from "@/lib/challenges/types";
import { GameIcon, ExternalLinkIcon } from "@/components/icons/GameIcons";
import { AvatarGlyph } from "@/components/profile/AvatarGlyph";
import { orderedEnabledSections, resolvePortfolioText } from "@/lib/portfolio";
import { groupEndorsementsByTag, EndorsementRow } from "@/lib/skill-endorsements";

export interface PortfolioPinnedChallenge {
  id: string;
  title: string;
  title_ru: string | null;
  role: ChallengeRole;
  difficulty: ChallengeDifficulty;
  points: number;
}

interface PortfolioPreviewProps {
  isRu: boolean;
  profileUserId: string;
  username: string;
  displayName: string;
  tagline: string | null;
  bio: string;
  // Ручной редактор (Profile → Портфолио) — переопределения, независимые
  // от "настоящих" profile.display_name/tagline/bio, см. resolvePortfolioText
  // в lib/portfolio.ts. null/пусто = использовать значение выше как есть.
  titleOverride: string | null;
  taglineOverride: string | null;
  bioOverride: string | null;
  footerOverride: string | null;
  avatarColor: string;
  avatarEmblem: string | null;
  roleLabel: string | null;
  location: string | null;
  bannerCss: string;
  links: { url: string; label: string }[];
  techStack: string[];
  score: number;
  level: WrenchLevel;
  badgeIds: string[];
  pinnedChallenges: PortfolioPinnedChallenge[];
  enabledSections: string[];
}

// Максимум топ-тегов по эндорсементам, показанных в компактном
// портфолио — тот же принцип конечной витрины, что у MAX_PINNED/
// MAX_STACK_TAGS в app/[locale]/profile/page.tsx: постер не резиновый,
// восемь эндорсированных тегов туда не влезут читаемо.
const MAX_ENDORSED_TAGS_SHOWN = 3;
// Столько наград помещается в постер без переполнения — та же логика
// "витрина, не полный список", что у Overview-вкладки самого профиля
// (там тоже .slice(0, 8) для другой карточки).
const MAX_BADGES_SHOWN = 6;

// Живой предпросмотр того же самого набора разделов, что уходит в
// экспорт (app/api/portfolio/[username]/route.ts) — Tailwind-разметка
// здесь и inline-стили в серверном роуте физически не могут быть одним
// деревом (Satori, на котором работает next/og ImageResponse, понимает
// только ограниченное подмножество inline flexbox-стилей, без
// Tailwind-классов), поэтому это НАМЕРЕННО два разных дерева, которые
// нужно вручную держать визуально согласованными — см. комментарий в
// самом роуте экспорта.
export function PortfolioPreview(props: PortfolioPreviewProps) {
  const { isRu, profileUserId, username, displayName, tagline, bio, titleOverride, taglineOverride, bioOverride, footerOverride,
    avatarColor, avatarEmblem, roleLabel, location, bannerCss, links, techStack, score, level, badgeIds, pinnedChallenges, enabledSections } = props;

  const [endorsementRows, setEndorsementRows] = useState<EndorsementRow[]>([]);

  const sections = orderedEnabledSections(enabledSections);
  const showEndorsements = sections.some((s) => s.id === "endorsements") && techStack.length > 0;
  const showBanner = sections.some((s) => s.id === "banner");
  const showAvatar = sections.some((s) => s.id === "avatar");

  const resolvedTitle   = resolvePortfolioText(titleOverride, displayName || `@${username}`);
  const resolvedTagline = resolvePortfolioText(taglineOverride, tagline ?? "");
  const resolvedBio     = resolvePortfolioText(bioOverride, bio);
  const resolvedFooter  = resolvePortfolioText(footerOverride, "wrench-branch.vercel.app");

  useEffect(() => {
    if (!showEndorsements) { setEndorsementRows([]); return; }
    let cancelled = false;
    createClient()
      .from("skill_endorsements")
      .select("skill_tag, endorser_id")
      .eq("endorsee_id", profileUserId)
      .then(({ data, error }: { data: EndorsementRow[] | null; error: unknown }) => {
        if (cancelled) return;
        if (error) { console.error("PortfolioPreview: failed to load endorsements", error); return; }
        setEndorsementRows(data ?? []);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileUserId, showEndorsements]);

  const initials = (displayName || username || "?")[0]?.toUpperCase() ?? "?";
  const stackTags = techStack.map(getStackTag).filter((t): t is NonNullable<typeof t> => Boolean(t));
  const earnedBadges = badgeIds.map((id) => BADGES.find((b) => b.id === id)).filter((b): b is NonNullable<typeof b> => Boolean(b));

  const topEndorsedTags = Array.from(groupEndorsementsByTag(endorsementRows).entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, MAX_ENDORSED_TAGS_SHOWN)
    .map(([tag, rows]) => ({ tag: getStackTag(tag), count: rows.length }))
    .filter((t): t is { tag: NonNullable<ReturnType<typeof getStackTag>>; count: number } => Boolean(t.tag));

  return (
    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-surface shadow-lg">
      {/* Имя/юзернейм/роль/локация — единственное, что остаётся
          обязательным (см. комментарий у PORTFOLIO_SECTIONS в
          lib/portfolio.ts); фон и аватар теперь такие же переключаемые
          разделы, как и всё остальное. */}
      {showBanner && <div className="h-20 w-full" style={{ background: bannerCss }} />}
      <div className={`px-5 pb-5 ${showBanner ? "" : "pt-5"}`}>
        {showAvatar && (
          <div className={`flex items-end gap-3 ${showBanner ? "-mt-8" : ""}`}>
            <AvatarGlyph color={avatarColor} emblemId={avatarEmblem} initials={initials}
              sizeClass="h-16 w-16 text-2xl" className="shrink-0 border-4 border-surface" />
          </div>
        )}
        <h3 className="mt-2 text-lg font-bold text-text-primary">{resolvedTitle}</h3>
        <p className="flex flex-wrap items-center gap-1 text-xs text-text-muted">
          <span>@{username}</span>
          {roleLabel && (<><span aria-hidden="true">·</span><span>{roleLabel}</span></>)}
          {location && (<><span aria-hidden="true">·</span><span>{location}</span></>)}
        </p>

        {sections.map((section) => {
          switch (section.id) {
            case "tagline":
              return resolvedTagline ? <p key="tagline" className="mt-3 text-sm font-medium text-accent">{resolvedTagline}</p> : null;

            case "bio":
              return resolvedBio ? <p key="bio" className="mt-2 text-sm text-text-secondary">{resolvedBio}</p> : null;

            case "links":
              return links.length > 0 ? (
                <div key="links" className="mt-3 flex flex-wrap gap-1.5">
                  {links.map((l) => (
                    <span key={l.label} className="flex items-center gap-1 rounded border border-border px-2 py-0.5 text-xs text-text-muted">
                      <ExternalLinkIcon size={10} /> {l.label}
                    </span>
                  ))}
                </div>
              ) : null;

            case "tech_stack":
              return stackTags.length > 0 ? (
                <div key="tech_stack" className="mt-3 flex flex-wrap gap-1.5">
                  {stackTags.map((t) => (
                    <span key={t.id} className="rounded border border-accent/20 bg-accent/5 px-2 py-0.5 text-xs text-accent">
                      {isRu ? t.labelRu : t.label}
                    </span>
                  ))}
                </div>
              ) : null;

            case "score":
              return (
                <div key="score" className="mt-3 flex items-center gap-2 rounded-lg border px-3 py-2"
                  style={{ borderColor: level.color + "40", background: level.color + "10" }}>
                  <GameIcon id={level.icon} size={16} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: level.color }}>{isRu ? level.labelRu : level.label}</p>
                    <p className="text-[11px] text-text-muted">{score} pts</p>
                  </div>
                </div>
              );

            case "badges":
              return earnedBadges.length > 0 ? (
                <div key="badges" className="mt-3">
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-text-muted">
                    {isRu ? "Награды" : "Badges"} · {earnedBadges.length}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {earnedBadges.slice(0, MAX_BADGES_SHOWN).map((b) => (
                      <span key={b.id} title={isRu ? b.descriptionRu : b.description}
                        className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${BADGE_COLOR[b.color] ?? BADGE_COLOR.amber}`}>
                        <GameIcon id={b.icon} size={11} />{isRu ? b.labelRu : b.label}
                      </span>
                    ))}
                    {earnedBadges.length > MAX_BADGES_SHOWN && (
                      <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-text-muted">
                        +{earnedBadges.length - MAX_BADGES_SHOWN}
                      </span>
                    )}
                  </div>
                </div>
              ) : null;

            case "pinned_challenges":
              return pinnedChallenges.length > 0 ? (
                <div key="pinned_challenges" className="mt-3">
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-text-muted">
                    {isRu ? "Закреплённые решения" : "Pinned solutions"}
                  </p>
                  <div className="space-y-1">
                    {pinnedChallenges.map((c) => {
                      const roleMeta = ROLE_META[c.role];
                      const diffMeta = DIFFICULTY_META[c.difficulty];
                      return (
                        <div key={c.id} className="flex items-center justify-between gap-2 rounded-md border border-border bg-canvas px-2.5 py-1.5">
                          <span className="min-w-0 truncate text-xs text-text-primary">{isRu && c.title_ru ? c.title_ru : c.title}</span>
                          <span className="flex shrink-0 items-center gap-1.5 text-[10px]">
                            <span className="text-text-muted">{isRu ? roleMeta.labelRu : roleMeta.label}</span>
                            <span className={diffMeta.colorClass}>{isRu ? diffMeta.labelRu : diffMeta.label}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null;

            case "endorsements":
              return topEndorsedTags.length > 0 ? (
                <div key="endorsements" className="mt-3">
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-text-muted">
                    {isRu ? "Эндорсементы навыков" : "Skill endorsements"}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {topEndorsedTags.map(({ tag, count }) => (
                      <span key={tag.id} className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] text-text-secondary">
                        {isRu ? tag.labelRu : tag.label} <span className="font-mono text-text-muted">·{count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ) : null;

            default:
              return null;
          }
        })}

        <p className="mt-4 border-t border-border pt-3 text-center text-[10px] tracking-wide text-text-muted">
          {resolvedFooter}
        </p>
      </div>
    </div>
  );
}
