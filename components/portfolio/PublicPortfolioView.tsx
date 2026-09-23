"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { localePath, Locale } from "@/lib/i18n/config";
import { ROLE_TAGS } from "@/lib/profile-roles";
import { getBannerGradient } from "@/lib/profile-banners";
import { checkAchievements } from "@/lib/achievements";
import { EndorsementRow, countDistinctEndorsers, countDistinctEndorsedSkills } from "@/lib/skill-endorsements";
import { calcWrenchScore, getLevel } from "@/lib/wrench-score";
import { GameIcon } from "@/components/icons/GameIcons";
import { PortfolioPreview, PortfolioPinnedChallenge } from "@/components/portfolio/PortfolioPreview";
import { PortfolioExperienceEntry, PortfolioProjectEntry, PortfolioThemeId } from "@/lib/portfolio";

interface PublicPortfolioProfile {
  id:                       string;
  username:                 string;
  display_name:             string;
  bio:                      string;
  avatar_color:             string;
  avatar_emblem:            string | null;
  role_tag:                 string;
  banner_gradient:          string | null;
  tagline:                  string | null;
  github_url:               string | null;
  linkedin_url:             string | null;
  website_url:              string | null;
  pinned_challenge_ids:     string[];
  tech_stack:               string[];
  location:                 string | null;
  portfolio_sections:       string[];
  portfolio_section_order:  string[];
  portfolio_theme:          string;
  portfolio_title:          string | null;
  portfolio_tagline:        string | null;
  portfolio_bio:            string | null;
  portfolio_footer:         string | null;
  portfolio_experience:     PortfolioExperienceEntry[];
  portfolio_projects:       PortfolioProjectEntry[];
}

interface Stats {
  total_solved:   number;
  total_points:   number;
  current_streak: number;
  longest_streak: number;
}

interface PublicPortfolioViewProps {
  locale:   Locale;
  username: string;
}

// Тот же приём "не найдено" на все случаи (нет такого username, профиль
// приватный, аккаунт удалён), что уже применён в PublicProfileView.tsx —
// не раскрывать зрителю по ссылке, какой из трёх случаев это на самом
// деле. RLS-политика profiles_select_public (is_public = true) сама
// решает, вернётся ли вообще строка — здесь просто доверяем результату,
// тот же принцип "RLS — единственное место проверки доступа".
type ViewState =
  | { kind: "loading" }
  | { kind: "not-found" }
  | { kind: "found"; profile: PublicPortfolioProfile; stats: Stats | null; toolsUsed: number; pinned: PortfolioPinnedChallenge[]; endorsementRows: EndorsementRow[] };

export function PublicPortfolioView({ locale, username }: PublicPortfolioViewProps) {
  const isRu = locale === "ru";
  const { user } = useAuth();
  const [state, setState] = useState<ViewState>({ kind: "loading" });
  // Счётчик просмотров (roadmap: "счётчик просмотров/скачиваний
  // портфолио") — инкрементим ровно один раз за открытие страницы, не на
  // каждый ре-рендер: ref, а не просто вызов внутри .then() ниже,
  // потому что тот же эффект перезапускается при смене username (переход
  // между чужими портфолио без размонтирования компонента).
  const viewCountedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "loading" });
    viewCountedRef.current = false;

    const supabase = createClient();

    supabase
      .from("profiles")
      .select(
        "id, username, display_name, bio, avatar_color, avatar_emblem, role_tag, banner_gradient, tagline, " +
        "github_url, linkedin_url, website_url, pinned_challenge_ids, tech_stack, location, " +
        "portfolio_sections, portfolio_section_order, portfolio_theme, portfolio_title, portfolio_tagline, " +
        "portfolio_bio, portfolio_footer, portfolio_experience, portfolio_projects"
      )
      .eq("username", username)
      .single()
      .then(async ({ data: profile, error }: { data: PublicPortfolioProfile | null; error: unknown }) => {
        if (cancelled) return;
        if (error || !profile) { setState({ kind: "not-found" }); return; }

        // Fire-and-forget — та же узкая SECURITY DEFINER функция
        // (increment_portfolio_view_count, supabase/portfolio-migration.sql),
        // что и у increment_workbench_clone_count в useWorkbenches.ts:
        // трогает ровно одну колонку и только у публичной строки, так
        // что анонимный вызов ничего, кроме счётчика, изменить не может.
        // Ошибка тут не критична для самой страницы — не блокируем
        // рендер и не показываем её посетителю.
        if (!viewCountedRef.current) {
          viewCountedRef.current = true;
          supabase.rpc("increment_portfolio_view_count", { p_id: profile.id })
            .then(({ error: rpcError }: { error: unknown }) => {
              if (rpcError) console.error("PublicPortfolioView: view count increment failed", rpcError);
            });
        }

        const [{ data: streak }, { count: toolsUsed }, pinnedResult, { data: endorseRows }] = await Promise.all([
          supabase.from("user_streaks").select("total_solved, total_points, current_streak, longest_streak").eq("user_id", profile.id).single(),
          supabase.from("tool_history").select("id", { count: "exact", head: true }).eq("user_id", profile.id),
          profile.pinned_challenge_ids?.length
            ? supabase.from("challenges").select("id, title, title_ru, role, difficulty, points").in("id", profile.pinned_challenge_ids)
            : Promise.resolve({ data: [] as PortfolioPinnedChallenge[] }),
          // Публично читаемо — тот же RLS, что и в PublicProfileView.tsx.
          // roadmap item 1 (Skill-badges 2.0).
          supabase.from("skill_endorsements").select("skill_tag, endorser_id").eq("endorsee_id", profile.id),
        ]);

        if (cancelled) return;
        // Сохраняем порядок закрепления, а не порядок ответа .in() — тот
        // же приём, что и в PublicProfileView.tsx.
        const pinnedRows = (pinnedResult.data ?? []) as PortfolioPinnedChallenge[];
        const pinnedMap  = new Map<string, PortfolioPinnedChallenge>(pinnedRows.map((c) => [c.id, c]));
        const pinned = (profile.pinned_challenge_ids ?? [])
          .map((id: string) => pinnedMap.get(id))
          .filter((c: PortfolioPinnedChallenge | undefined): c is PortfolioPinnedChallenge => Boolean(c));

        setState({
          kind: "found",
          profile,
          stats: (streak as Stats) ?? null,
          toolsUsed: toolsUsed ?? 0,
          pinned,
          endorsementRows: (endorseRows as EndorsementRow[]) ?? [],
        });
      });

    return () => { cancelled = true; };
  }, [username]);

  if (state.kind === "loading") return null;

  if (state.kind === "not-found") {
    return (
      <div className="mx-auto max-w-lg px-5 py-16 text-center">
        <div className="mb-3 flex justify-center text-text-muted"><GameIcon id="wrench" size={28} /></div>
        <h1 className="text-lg font-semibold text-text-primary">
          {isRu ? "Портфолио не найдено" : "Portfolio not found"}
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          {isRu
            ? "Такой страницы нет, либо её автор сделал профиль приватным."
            : "This page doesn't exist, or its owner made the profile private."}
        </p>
        <Link href={localePath(locale, "/")}
          className="mt-5 inline-block rounded bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-amber-400">
          {isRu ? "На главную" : "Go home"}
        </Link>
      </div>
    );
  }

  const { profile, stats, toolsUsed, pinned, endorsementRows } = state;
  const role = ROLE_TAGS.find((r) => r.id === profile.role_tag);
  const banner = getBannerGradient(profile.banner_gradient);

  // Тот же живой пересчёт достижений из публичной статистики, что уже
  // использует PublicProfileView.tsx — не отдельный запрос к таблице
  // achievements (её публичное чтение сюда специально не открывали).
  const badges = stats ? checkAchievements({
    ...stats, isPro: false,
    endorsed_by_count: countDistinctEndorsers(endorsementRows),
    endorsed_skills_count: countDistinctEndorsedSkills(endorsementRows),
  }) : [];
  const score = stats ? calcWrenchScore({ ...stats, tools_used: toolsUsed, badges_count: badges.length }) : 0;
  const level = getLevel(score);

  const links = [
    { url: profile.github_url,   label: "GitHub" },
    { url: profile.linkedin_url, label: "LinkedIn" },
    { url: profile.website_url,  label: isRu ? "Сайт" : "Website" },
  ].filter((l): l is { url: string; label: string } => Boolean(l.url));

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-5 py-8">
      <PortfolioPreview
        isRu={isRu}
        profileUserId={profile.id}
        username={profile.username}
        displayName={profile.display_name}
        tagline={profile.tagline}
        bio={profile.bio}
        titleOverride={profile.portfolio_title}
        taglineOverride={profile.portfolio_tagline}
        bioOverride={profile.portfolio_bio}
        footerOverride={profile.portfolio_footer}
        avatarColor={profile.avatar_color}
        avatarEmblem={profile.avatar_emblem}
        roleLabel={role ? (isRu ? role.labelRu : role.label) : null}
        location={profile.location}
        bannerCss={banner?.css ?? "var(--accent)"}
        links={links}
        techStack={profile.tech_stack}
        score={score}
        level={level}
        badgeIds={badges}
        pinnedChallenges={pinned}
        experience={profile.portfolio_experience}
        projects={profile.portfolio_projects}
        enabledSections={profile.portfolio_sections}
        sectionOrder={profile.portfolio_section_order}
        themeId={profile.portfolio_theme as PortfolioThemeId}
        isPublic
      />

      {/* Та же ссылка на обычный публичный профиль и то же приглашение
          зарегистрироваться незалогиненному гостю, что уже есть на
          /u/[username] (PublicProfileView.tsx) — портфолио теперь второй
          вход на тот же публичный контент, не изолированная страница
          сама по себе. */}
      <div className="mt-4 flex w-full max-w-sm flex-col items-center gap-3">
        <Link href={localePath(locale, `/u/${profile.username}`)}
          className="text-xs text-text-muted underline-offset-2 transition-colors hover:text-text-secondary hover:underline">
          {isRu ? "Открыть обычный профиль" : "Open the regular profile"}
        </Link>
        {!user && (
          <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3">
            <p className="text-sm text-text-secondary">
              {isRu
                ? "Понравилось портфолио? Построй своё на Wrench-Branch."
                : "Like this portfolio? Build your own on Wrench-Branch."}
            </p>
            <Link href={localePath(locale, "/auth/signup")}
              className="shrink-0 rounded bg-accent px-4 py-2 text-xs font-medium text-accent-fg transition-colors hover:bg-amber-400">
              {isRu ? "Зарегистрироваться" : "Sign up"}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
