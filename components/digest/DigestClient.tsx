"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { localePath, Locale } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/client";
import { ROLE_META, DIFFICULTY_META, ChallengeRole, ChallengeDifficulty } from "@/lib/challenges/types";
import { getImplementedTools } from "@/lib/tools-registry";
import { ruToolContent } from "@/lib/i18n/ru-content";
import {
  DIGEST_TAGLINES, DIGEST_SIGNOFFS, DIGEST_FACTS, DIGEST_TOOL_INTROS, DIGEST_LEADERBOARD_INTROS,
  getDigestDayIndex,
} from "@/lib/digest-content";
import { NewspaperIcon } from "@/components/icons/GameIcons";
import { AvatarGlyph } from "@/components/profile/AvatarGlyph";

// Тот же приём с фиксированными Tailwind-классами по роли, что уже
// есть в app/[locale]/challenges/page.tsx — цвет роли нельзя собирать
// динамической строкой (`text-${color}-400`), Tailwind не подхватит
// класс, которого нет буквально в исходниках.
const ROLE_COLORS: Record<ChallengeRole, { badge: string; dot: string }> = {
  qa:       { badge: "border-amber-500/30 bg-amber-500/10 text-amber-400", dot: "bg-amber-400" },
  frontend: { badge: "border-blue-500/30 bg-blue-500/10 text-blue-400",   dot: "bg-blue-400" },
  backend:  { badge: "border-green-500/30 bg-green-500/10 text-green-400", dot: "bg-green-400" },
};

const ROLES: ChallengeRole[] = ["qa", "frontend", "backend"];

interface DailyChallengeInfo {
  id: string;
  title: string;
  title_ru: string | null;
  difficulty: ChallengeDifficulty;
  points: number;
}
interface DailyChallengeRow {
  role: ChallengeRole;
  challenge: DailyChallengeInfo | null;
}
interface SolvedCountRow {
  role: ChallengeRole;
  solved_count: number;
}
interface LeaderboardEntry {
  username: string;
  display_name: string | null;
  avatar_color: string;
  avatar_emblem: string | null;
  current_streak: number;
  longest_streak: number;
}

export function DigestClient({ locale }: { locale: Locale }) {
  const isRu = locale === "ru";

  // Фиксируем "сегодня" один раз на маунт компонента — от этой же даты
  // считаются и запрос к Supabase, и индексы во всех текстовых пулах,
  // чтобы дайджест был внутренне согласован в течение одного открытия
  // страницы, даже если рендер идёт долю секунды до полуночи.
  const today = useMemo(() => new Date(), []);
  const todayIso = useMemo(() => today.toISOString().slice(0, 10), [today]);

  const [challenges, setChallenges] = useState<DailyChallengeRow[]>([]);
  const [solvedCounts, setSolvedCounts] = useState<SolvedCountRow[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    (async () => {
      // Три независимых запроса, каждый в своём try/catch — падение
      // одного (например .rpc() отсутствует у заглушки без настроенного
      // Supabase, см. lib/supabase/client.ts) не должно скрыть два
      // других раздела дайджеста, которые вполне могли загрузиться.
      try {
        const { data, error } = await supabase
          .from("daily_challenges")
          .select("role, challenge:challenges(id, title, title_ru, difficulty, points)")
          .eq("scheduled_for", todayIso);
        if (error) throw error;
        if (!cancelled) setChallenges((data as unknown as DailyChallengeRow[]) ?? []);
      } catch {
        if (!cancelled) setChallenges([]);
      }

      try {
        const { data, error } = await supabase.rpc("get_daily_solved_counts", { p_date: todayIso });
        if (error) throw error;
        if (!cancelled) setSolvedCounts((data as SolvedCountRow[]) ?? []);
      } catch {
        if (!cancelled) setSolvedCounts([]);
      }

      try {
        const { data, error } = await supabase.rpc("get_streak_leaderboard", { p_limit: 5 });
        if (error) throw error;
        if (!cancelled) setLeaderboard((data as LeaderboardEntry[]) ?? []);
      } catch {
        if (!cancelled) setLeaderboard([]);
      }

      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [todayIso]);

  const tagline = DIGEST_TAGLINES[getDigestDayIndex(DIGEST_TAGLINES.length, today)];
  const signoff = DIGEST_SIGNOFFS[getDigestDayIndex(DIGEST_SIGNOFFS.length, today)];
  const fact = DIGEST_FACTS[getDigestDayIndex(DIGEST_FACTS.length, today)];
  const toolIntro = DIGEST_TOOL_INTROS[getDigestDayIndex(DIGEST_TOOL_INTROS.length, today)];
  const leaderboardIntro = DIGEST_LEADERBOARD_INTROS[getDigestDayIndex(DIGEST_LEADERBOARD_INTROS.length, today)];

  const implementedTools = useMemo(() => getImplementedTools(), []);
  const featuredTool = implementedTools[getDigestDayIndex(implementedTools.length, today)];
  // Тот же приём слияния с русской надстройкой, что уже есть в
  // searchTools() (lib/tools-registry.ts) — реестр инструментов сам
  // хранит только английский текст, перевод живёт отдельно в
  // ru-content.ts по slug, и его не подхватывает ничего автоматически.
  const featuredToolRu = featuredTool ? ruToolContent[featuredTool.slug] : undefined;
  const featuredToolName = featuredToolRu?.name && isRu ? featuredToolRu.name : featuredTool?.name;
  const featuredToolDescription =
    featuredToolRu?.shortDescription && isRu ? featuredToolRu.shortDescription : featuredTool?.shortDescription;

  const dateLabel = today.toLocaleDateString(isRu ? "ru-RU" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  function solvedCountFor(role: ChallengeRole): number {
    return solvedCounts.find((s) => s.role === role)?.solved_count ?? 0;
  }

  function initialsFor(entry: LeaderboardEntry): string {
    const source = entry.display_name || entry.username || "?";
    return source.slice(0, 1).toUpperCase();
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      {/* Шапка-масштхед */}
      <div className="mb-8 border-b border-border pb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-canvas text-accent">
          <NewspaperIcon size={22} />
        </div>
        <h1 className="text-2xl font-bold text-text-primary">
          {isRu ? "Дневной дайджест Wrench-Branch" : "The Wrench-Branch Daily Digest"}
        </h1>
        <p className="mt-1.5 text-sm italic text-text-muted">{isRu ? tagline.ru : tagline.en}</p>
        <p className="mt-2 text-xs uppercase tracking-wider text-text-disabled">{dateLabel}</p>
      </div>

      <div className="space-y-6">
        {/* Сегодняшние челленджи */}
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 text-base font-semibold text-text-primary">
            {isRu ? "Сегодняшние челленджи" : "Today's challenges"}
          </h2>
          <div className="space-y-2.5">
            {ROLES.map((role) => {
              const row = challenges.find((c) => c.role === role);
              const challenge = row?.challenge ?? null;
              const meta = ROLE_META[role];
              const colors = ROLE_COLORS[role];
              const solved = solvedCountFor(role);
              return (
                <div key={role} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-canvas px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${colors.badge}`}>
                        {isRu ? meta.labelRu : meta.label}
                      </span>
                      {challenge && (
                        <span className={`text-[11px] ${DIFFICULTY_META[challenge.difficulty].colorClass}`}>
                          {isRu ? DIFFICULTY_META[challenge.difficulty].labelRu : DIFFICULTY_META[challenge.difficulty].label}
                          {" · "}{challenge.points} {isRu ? "очк." : "pts"}
                        </span>
                      )}
                    </div>
                    {loading ? (
                      <p className="text-sm text-text-muted">{isRu ? "Загрузка…" : "Loading…"}</p>
                    ) : challenge ? (
                      <p className="truncate text-sm text-text-primary">
                        {isRu && challenge.title_ru ? challenge.title_ru : challenge.title}
                      </p>
                    ) : (
                      <p className="text-sm text-text-muted">
                        {isRu ? "На сегодня ещё не запланирован — загляните в челленджи напрямую." : "Nothing scheduled for today yet — try the challenges directly."}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-text-muted">
                      {solved === 0
                        ? (isRu ? "Пока никто не решил." : "Nobody's solved it yet.")
                        : isRu
                        ? `${solved} ${solved === 1 ? "человек уже решил" : "человек уже решили"} сегодня.`
                        : `${solved} ${solved === 1 ? "person has" : "people have"} already solved it today.`}
                    </p>
                  </div>
                  <Link
                    href={localePath(locale, `/challenges/${role}`)}
                    className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg transition-colors hover:bg-accent/90"
                  >
                    {isRu ? "Играть" : "Play"}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* Инструмент дня */}
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-1 text-base font-semibold text-text-primary">{isRu ? "Инструмент дня" : "Tool of the day"}</h2>
          <p className="mb-4 text-xs text-text-muted">{isRu ? toolIntro.ru : toolIntro.en}</p>
          {featuredTool && (
            <Link
              href={localePath(locale, `/tools/${featuredTool.slug}`)}
              className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-canvas px-4 py-3 transition-colors hover:bg-surface-hover"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary">{featuredToolName}</p>
                <p className="mt-0.5 truncate text-xs text-text-muted">{featuredToolDescription}</p>
              </div>
              <span className="shrink-0 text-xs text-text-muted transition-colors group-hover:text-text-primary">
                {isRu ? "Открыть →" : "Open →"}
              </span>
            </Link>
          )}
        </section>

        {/* Факт дня */}
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-3 text-base font-semibold text-text-primary">{isRu ? "Факт дня" : "Fact of the day"}</h2>
          <blockquote className="border-l-2 border-accent/40 pl-4 text-sm leading-relaxed text-text-secondary">
            {isRu ? fact.ru : fact.en}
          </blockquote>
        </section>

        {/* Зал славы */}
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-1 text-base font-semibold text-text-primary">{isRu ? "Зал славы" : "Hall of fame"}</h2>
          <p className="mb-4 text-xs text-text-muted">{isRu ? leaderboardIntro.ru : leaderboardIntro.en}</p>
          {leaderboard.length === 0 ? (
            <p className="text-sm text-text-muted">
              {isRu
                ? "Пока никто не набрал стрик — или все скрыли профиль. Сделайте профиль публичным на /profile, чтобы попасть сюда."
                : "Nobody has a streak going yet — or everyone's profile is private. Make yours public on /profile to show up here."}
            </p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry, i) => (
                <div key={entry.username} className="flex items-center gap-3 rounded-lg border border-border bg-canvas px-3 py-2">
                  <span className="w-4 shrink-0 text-right font-mono text-xs text-text-disabled">{i + 1}</span>
                  <AvatarGlyph
                    color={entry.avatar_color}
                    emblemId={entry.avatar_emblem}
                    initials={initialsFor(entry)}
                    sizeClass="h-7 w-7 text-xs"
                  />
                  <Link
                    href={localePath(locale, `/u/${entry.username}`)}
                    className="min-w-0 flex-1 truncate text-sm text-text-primary hover:text-accent transition-colors"
                  >
                    {entry.display_name || entry.username}
                  </Link>
                  <span className="shrink-0 text-xs text-text-muted">
                    {entry.current_streak} {isRu ? "дн. подряд" : entry.current_streak === 1 ? "day streak" : "day streak"}
                  </span>
                </div>
              ))}
            </div>
          )}
          {/* Это только топ-5 по стрику для дайджеста — полноценный,
              ранжированный по Wrench Score (не только стрику) список на
              /leaderboard, отдельная индексируемая страница (пункт 22 из
              ROADMAP-BRAINSTORM.md). */}
          <Link
            href={localePath(locale, "/leaderboard")}
            className="mt-3 inline-flex items-center gap-1 text-xs text-accent transition-colors hover:text-amber-400"
          >
            {isRu ? "Полный лидерборд Wrench Score →" : "Full Wrench Score leaderboard →"}
          </Link>
        </section>
      </div>

      <p className="mt-8 text-center text-xs italic text-text-muted">{isRu ? signoff.ru : signoff.en}</p>
    </div>
  );
}
