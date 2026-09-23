"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { localePath, Locale } from "@/lib/i18n/config";
import { ROLE_TAGS } from "@/lib/profile-roles";
import { getStackTag } from "@/lib/profile-stack";
import { getBannerGradient } from "@/lib/profile-banners";
import { BADGES, BADGE_COLOR, checkAchievements } from "@/lib/achievements";
import { ROLE_META, DIFFICULTY_META, ChallengeRole, ChallengeDifficulty } from "@/lib/challenges/types";
import { WrenchScorePanel } from "@/components/WrenchScorePanel";
import { GameIcon, ExternalLinkIcon } from "@/components/icons/GameIcons";
import { AvatarGlyph } from "@/components/profile/AvatarGlyph";
import { SkillEndorsements } from "@/components/profile/SkillEndorsements";
import { EndorsementRow, countDistinctEndorsers, countDistinctEndorsedSkills } from "@/lib/skill-endorsements";

interface PublicProfile {
  id:                    string;
  username:              string;
  display_name:          string;
  bio:                   string;
  avatar_color:          string;
  avatar_emblem:         string | null;
  role_tag:              string;
  banner_gradient:       string | null;
  tagline:               string | null;
  github_url:            string | null;
  linkedin_url:          string | null;
  website_url:           string | null;
  pinned_challenge_ids:  string[];
  tech_stack:            string[];
  location:              string | null;
  // Достижения как статус — supabase/achievements-status-migration.sql.
  // Публично видна ТОЛЬКО эта одна колонка (под уже существующей
  // profiles_select_public), а не весь список заработанных бейджей —
  // см. подробное объяснение в самой миграции.
  equipped_badge_id:     string | null;
}

interface Stats {
  total_solved:   number;
  total_points:   number;
  current_streak: number;
  longest_streak: number;
}

interface PinnedChallenge {
  id:         string;
  title:      string;
  title_ru:   string | null;
  role:       ChallengeRole;
  difficulty: ChallengeDifficulty;
  points:     number;
}

interface PublicProfileViewProps {
  locale:   Locale;
  username: string;
}

// "не найдено" покрывает три разных случая одной и той же надписью:
// такого username не существует, профиль существует но is_public =
// false, или пользователь удалил аккаунт. Тот же приём, что уже
// применён в PublicWorkbenchView.tsx — разбирать эти случаи по
// отдельности ничего не даёт зрителю по ссылке, а "этот профиль скрыт
// автором" звучало бы как утечка информации о том, что username вообще
// существует в базе.
type ViewState =
  | { kind: "loading" }
  | { kind: "not-found" }
  | { kind: "found"; profile: PublicProfile; stats: Stats | null; toolsUsed: number; pinned: PinnedChallenge[]; endorsementRows: EndorsementRow[] };

export function PublicProfileView({ locale, username }: PublicProfileViewProps) {
  const isRu = locale === "ru";
  const { user } = useAuth();
  const [state, setState] = useState<ViewState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "loading" });

    const supabase = createClient();

    // Фильтруем только по username, а не ещё и по is_public — эту часть
    // уже делает RLS-политика profiles_select_public (is_public = true,
    // см. supabase/profile-public-migration.sql) на стороне базы: для
    // анонимного посетителя приватная строка просто не существует в
    // ответе, каким бы ни был WHERE в самом запросе. Тот же принцип, что
    // и в PublicWorkbenchView.tsx — доверяем RLS как единственному месту
    // проверки доступа, не дублируем её в JS.
    supabase
      .from("profiles")
      .select("id, username, display_name, bio, avatar_color, avatar_emblem, role_tag, banner_gradient, tagline, github_url, linkedin_url, website_url, pinned_challenge_ids, tech_stack, location, equipped_badge_id")
      .eq("username", username)
      .single()
      .then(async ({ data: profile, error }: { data: PublicProfile | null; error: unknown }) => {
        if (cancelled) return;
        if (error || !profile) { setState({ kind: "not-found" }); return; }

        const [{ data: streak }, { count: toolsUsed }, pinnedResult, { data: endorseRows }] = await Promise.all([
          supabase.from("user_streaks").select("total_solved, total_points, current_streak, longest_streak").eq("user_id", profile.id).single(),
          supabase.from("tool_history").select("id", { count: "exact", head: true }).eq("user_id", profile.id),
          profile.pinned_challenge_ids?.length
            ? supabase.from("challenges").select("id, title, title_ru, role, difficulty, points").in("id", profile.pinned_challenge_ids)
            : Promise.resolve({ data: [] as PinnedChallenge[] }),
          // Публично читаемо — skill_endorsements_select_public (см.
          // supabase/skill-endorsements-migration.sql) уже отдаёт эти
          // строки анониму для is_public-профиля, тот же RLS, что и у
          // SkillEndorsements.tsx ниже. roadmap item 1 (Skill-badges 2.0).
          supabase.from("skill_endorsements").select("skill_tag, endorser_id").eq("endorsee_id", profile.id),
        ]);

        if (cancelled) return;
        // Сохраняем порядок, в котором пользователь сам закрепил задачи
        // (pinned_challenge_ids), а не порядок, в котором их вернула
        // база — .in() не гарантирует порядок результата.
        const pinnedRows = (pinnedResult.data ?? []) as PinnedChallenge[];
        const pinnedMap  = new Map<string, PinnedChallenge>(pinnedRows.map((c) => [c.id, c]));
        const pinned = (profile.pinned_challenge_ids ?? [])
          .map((id: string) => pinnedMap.get(id))
          .filter((c: PinnedChallenge | undefined): c is PinnedChallenge => Boolean(c));

        setState({
          kind: "found",
          profile: profile as PublicProfile,
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
          {isRu ? "Профиль не найден" : "Profile not found"}
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
  const initials = (profile.display_name || profile.username || "?")[0].toUpperCase();
  const role = ROLE_TAGS.find((r) => r.id === profile.role_tag);
  const banner = getBannerGradient(profile.banner_gradient);

  // Бейджи считаются той же чистой функцией, что и на приватной странице
  // (app/[locale]/profile/page.tsx) — из streak-статистики, а не из
  // отдельного запроса к таблице achievements (она сейчас вообще нигде
  // не читается для отображения, только как задел на будущее). isPro
  // сюда осознанно не передаётся: чтобы показать бейдж "Pro Member",
  // пришлось бы читать subscriptions от лица анонимного посетителя, а
  // значит — открывать ещё одну публичную RLS-политику ради статуса
  // оплаты, которую на публичной странице показывать не обязательно.
  // Отложено, а не забыто.
  const badges = stats ? checkAchievements({
    ...stats, isPro: false,
    endorsed_by_count: countDistinctEndorsers(endorsementRows),
    endorsed_skills_count: countDistinctEndorsedSkills(endorsementRows),
  }) : [];

  // Статус-бейдж (equipped_badge_id) — единственное, что публично видно
  // из "когда-либо заработанного" набора владельца (не только из этого
  // урезанного live-пересчёта выше): он мог быть заработан через
  // избранное/рабочие столы/историю инструментов — данные, которые
  // здесь, на чужом публичном профиле, недоступны и не пересчитываются.
  // Достаточно того, что id один раз прошёл проверку FK на БД-уровне
  // (profiles_equipped_badge_fk) при экипировке — см. миграцию.
  const equippedBadge = profile.equipped_badge_id ? BADGES.find((b) => b.id === profile.equipped_badge_id) : null;

  const links = [
    { url: profile.github_url,   label: "GitHub" },
    { url: profile.linkedin_url, label: "LinkedIn" },
    { url: profile.website_url,  label: isRu ? "Сайт" : "Website" },
  ].filter((l): l is { url: string; label: string } => Boolean(l.url));

  const stackTags = profile.tech_stack.map(getStackTag).filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      {/* Баннер + аватарка внахлёст — тот же визуальный язык, что у
          привычных профилей разработчика (GitHub и т.п.), но без
          загрузки картинок: баннер — один из готовых градиентов
          (lib/profile-banners.ts), аватарка — тот же цветной кружок с
          инициалом, что и на приватной странице настроек. */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="h-24 w-full" style={{ background: banner?.css ?? "var(--accent)" }} />
        <div className="px-5 pb-5">
          <div className="-mt-10 flex items-end gap-4">
            <AvatarGlyph
              color={profile.avatar_color}
              emblemId={profile.avatar_emblem}
              initials={initials}
              sizeClass="h-20 w-20 text-3xl"
              className="shrink-0 border-4 border-surface"
            />
          </div>

          <div className="mt-3">
            <h1 className="text-xl font-bold text-text-primary">
              {profile.display_name || `@${profile.username}`}
            </h1>
            <p className="flex items-center gap-1 text-sm text-text-muted">
              <span>@{profile.username}</span>
              {profile.location && (
                <>
                  <span aria-hidden="true">·</span>
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" className="shrink-0" aria-hidden>
                    <path d="M8 14.5s5-4.36 5-8.5a5 5 0 10-10 0c0 4.14 5 8.5 5 8.5z" stroke="currentColor" strokeWidth="1.3"/>
                    <circle cx="8" cy="6" r="1.8" stroke="currentColor" strokeWidth="1.3"/>
                  </svg>
                  <span>{profile.location}</span>
                </>
              )}
            </p>

            {profile.tagline && (
              <p className="mt-2 text-sm font-medium text-accent">{profile.tagline}</p>
            )}
            {profile.bio && (
              <p className="mt-1 text-sm text-text-secondary max-w-md">{profile.bio}</p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {equippedBadge && (
                <span title={isRu ? equippedBadge.descriptionRu : equippedBadge.description}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${BADGE_COLOR[equippedBadge.color] ?? BADGE_COLOR.amber}`}>
                  <GameIcon id={equippedBadge.icon} size={12} />
                  {isRu ? equippedBadge.labelRu : equippedBadge.label}
                </span>
              )}
              {role && (
                <span className="rounded border border-border px-2 py-0.5 text-xs text-text-muted">
                  {isRu ? role.labelRu : role.label}
                </span>
              )}
              {links.map((l) => (
                <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded border border-border px-2 py-0.5 text-xs text-text-muted transition-colors hover:border-border-focus hover:text-text-secondary">
                  <ExternalLinkIcon size={11} /> {l.label}
                </a>
              ))}
            </div>

            {/* Стек — отдельная строка чипов, не смешана со строкой
                роль/ссылки выше: та строка — про идентичность и внешние
                профили, эта — конкретный список технологий, который
                может быть длиннее и хочет своей строки, чтобы не ломать
                перенос остальных чипов. */}
            {stackTags.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {stackTags.map((t) => (
                  <span key={t.id} className="rounded border border-accent/20 bg-accent/5 px-2 py-0.5 text-xs text-accent">
                    {isRu ? t.labelRu : t.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTA для гостя — раньше зашедшему по ссылке (например, из
          README/LinkedIn) было некуда идти дальше: он видел чужой
          профиль и ничего, что вело бы обратно на сайт. Показываем
          только незалогиненным — у вошедшего пользователя уже есть
          свой аккаунт, ему это предложение не нужно. */}
      {!user && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3">
          <p className="text-sm text-text-secondary">
            {isRu
              ? "Понравился профиль? Построй свой на Wrench-Branch."
              : "Like what you see? Build your own profile on Wrench-Branch."}
          </p>
          <Link href={localePath(locale, "/auth/signup")}
            className="shrink-0 rounded bg-accent px-4 py-2 text-xs font-medium text-accent-fg transition-colors hover:bg-amber-400">
            {isRu ? "Зарегистрироваться" : "Sign up"}
          </Link>
        </div>
      )}

      <div className="mt-6 space-y-6">
        {/* Wrench Score — тот же компонент, что и на приватной странице,
            просто со статистикой чужого (публичного) профиля. */}
        {stats && (
          <WrenchScorePanel stats={stats} toolsUsed={toolsUsed} badgesCount={badges.length} isRu={isRu} />
        )}

        {/* Витрина закреплённых задач — то, что пользователь сам выбрал
            показать первым делом, а не просто agregированную цифру. */}
        {pinned.length > 0 && (
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="mb-3 text-sm font-semibold text-text-primary">
              {isRu ? "Закреплённые решения" : "Pinned solutions"}
            </h2>
            <div className="space-y-2">
              {pinned.map((c) => {
                const roleMeta = ROLE_META[c.role];
                const diffMeta = DIFFICULTY_META[c.difficulty];
                return (
                  <Link key={c.id} href={localePath(locale, `/challenges/${c.role}`)}
                    className="flex items-center justify-between gap-3 rounded-md border border-border bg-canvas px-3 py-2.5 transition-colors hover:border-border-focus hover:bg-surface-hover">
                    <span className="min-w-0 truncate text-sm text-text-primary">
                      {isRu && c.title_ru ? c.title_ru : c.title}
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-xs">
                      <span className="text-text-muted">{isRu ? roleMeta.labelRu : roleMeta.label}</span>
                      <span className={diffMeta.colorClass}>{isRu ? diffMeta.labelRu : diffMeta.label}</span>
                      <span className="font-mono text-text-muted">+{c.points}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Peer-эндорсементы навыков (roadmap item 2) — только теги,
            которые владелец сам выбрал в tech_stack; компонент сам
            прячется целиком, если tech_stack пуст. isOwnProfile
            покрывает и залогиненного владельца, зашедшего на свою же
            публичную ссылку — эндорсить себя всё равно нельзя. */}
        <SkillEndorsements
          locale={locale}
          profileUserId={profile.id}
          techStack={profile.tech_stack}
          isOwnProfile={user?.id === profile.id}
        />

        {/* Бейджи */}
        {badges.length > 0 && (
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="mb-3 text-sm font-semibold text-text-primary">
              {isRu ? "Награды" : "Badges"} · {badges.length}
            </h2>
            <div className="flex flex-wrap gap-2">
              {badges.map((bid) => {
                const b = BADGES.find((x) => x.id === bid);
                if (!b) return null;
                return (
                  <div key={bid} title={isRu ? b.descriptionRu : b.description}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${BADGE_COLOR[b.color] ?? BADGE_COLOR.amber}`}>
                    <GameIcon id={b.icon} size={13} />
                    <span className="font-medium">{isRu ? b.labelRu : b.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
