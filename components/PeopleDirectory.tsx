"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { localePath, Locale } from "@/lib/i18n/config";
import { ROLE_TAGS } from "@/lib/profile-roles";
import { calcWrenchScore, getLevel } from "@/lib/wrench-score";
import { AvatarGlyph } from "@/components/profile/AvatarGlyph";
import { GameIcon } from "@/components/icons/GameIcons";
import { searchProfiles, DirectoryProfile, PEOPLE_PAGE_SIZE } from "@/lib/profile-directory";

// Очки для карточки в списке считаются ТОЛЬКО из user_streaks (очки +
// решённые + стрики) — без tools_used/badges_count, в отличие от
// "настоящего" Wrench Score на самой странице профиля (ProfileHero,
// WrenchScorePanel). Осознанный компромисс: посчитать эти два поля для
// N карточек разом означало бы ещё 1-2 запроса с count(*) группировкой
// по user_id, а разница по факту небольшая (капса tools_used всего 100
// очков, badges — по 20 за штуку) — для ранга в списке точность важнее
// не здесь, а на самом профиле, куда карточка и ведёт по клику.
interface RowStats {
  total_points:   number;
  total_solved:   number;
  current_streak: number;
  longest_streak: number;
}

function scoreFromRow(s: RowStats | undefined): number {
  if (!s) return 0;
  return calcWrenchScore({ ...s, tools_used: 0, badges_count: 0 });
}

interface PersonCardProps {
  locale:  Locale;
  profile: DirectoryProfile;
  score:   number;
}

function PersonCard({ locale, profile, score }: PersonCardProps) {
  const isRu   = locale === "ru";
  const level  = getLevel(score);
  const role   = ROLE_TAGS.find((r) => r.id === profile.role_tag);
  const name   = profile.display_name || `@${profile.username}`;
  const initials = (profile.display_name || profile.username || "?")[0].toUpperCase();

  return (
    <Link href={localePath(locale, `/u/${profile.username}`)}
      className="card-shine flex items-center gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent/30">
      <AvatarGlyph
        color={profile.avatar_color}
        emblemId={profile.avatar_emblem}
        initials={initials}
        sizeClass="h-11 w-11 text-sm"
        className="shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">{name}</p>
        <p className="truncate text-xs text-text-muted">@{profile.username}</p>
        {profile.tagline && (
          <p className="mt-0.5 truncate text-xs text-text-secondary">{profile.tagline}</p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {score > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border px-1.5 py-px text-[10px] font-medium"
              style={{ borderColor: level.color + "40", background: level.color + "15", color: level.color }}>
              <GameIcon id={level.icon} size={10} />
              {isRu ? level.labelRu : level.label}
            </span>
          )}
          {role && (
            <span className="rounded border border-border px-1.5 py-px text-[10px] text-text-muted">
              {isRu ? role.labelRu : role.label}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function PersonCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-surface-hover" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3.5 w-2/3 animate-pulse rounded bg-surface-hover" />
        <div className="h-2.5 w-1/3 animate-pulse rounded bg-surface-hover" />
      </div>
    </div>
  );
}

export function PeopleDirectory({ locale }: { locale: Locale }) {
  const isRu = locale === "ru";
  const [queryInput, setQueryInput] = useState("");
  // Отдельно от queryInput — то, что реально ушло в запрос, после
  // дебаунса. Раздельные стейты, а не один с ручным clearTimeout прямо
  // в onChange, чтобы поле ввода само не тормозило (перерисовывается
  // сразу), а сетевой запрос — с задержкой.
  const [query,     setQuery]     = useState("");
  const [role,      setRole]      = useState<string>("all");
  const [profiles,  setProfiles]  = useState<DirectoryProfile[]>([]);
  const [scores,    setScores]    = useState<Record<string, number>>({});
  const [count,     setCount]     = useState<number | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error,     setError]     = useState(false);
  const requestId = useRef(0);

  // Дебаунс поискового поля — 300мс без нажатий, прежде чем реально
  // сходить в БД (в отличие от поиска инструментов в SearchModal.tsx,
  // тут не статический массив в памяти, а сетевой запрос на каждое
  // нажатие клавиши было бы лишним).
  useEffect(() => {
    const t = setTimeout(() => setQuery(queryInput), 300);
    return () => clearTimeout(t);
  }, [queryInput]);

  useEffect(() => {
    const myId = ++requestId.current;
    setLoading(true);
    setError(false);
    const supabase = createClient();

    searchProfiles(supabase, { query, role, limit: PEOPLE_PAGE_SIZE, offset: 0 })
      .then(async ({ data, count: total, error: err }) => {
        // Пока этот запрос летел, ушёл более новый (сменили фильтр
        // раньше, чем пришёл ответ на предыдущий) — тот же приём, что
        // уже используется в AvatarGlyph/PublicProfileView через
        // cancelled-флаг, только через id запроса, потому что тут
        // запросов подряд может быть несколько (ввод в поиске).
        if (myId !== requestId.current) return;
        if (err) { setError(true); setLoading(false); return; }
        setProfiles(data);
        setCount(total);
        setLoading(false);

        if (data.length > 0) {
          const { data: streaks } = await supabase
            .from("user_streaks")
            .select("user_id, total_points, total_solved, current_streak, longest_streak")
            .in("user_id", data.map((p) => p.id));
          if (myId !== requestId.current) return;
          const map: Record<string, number> = {};
          (streaks as (RowStats & { user_id: string })[] | null)?.forEach((s) => {
            map[s.user_id] = scoreFromRow(s);
          });
          setScores(map);
        } else {
          setScores({});
        }
      })
      // .catch(), а не только проверка { error } выше — та ветка ловит
      // ошибку, которую вернул сам Supabase (например RLS отказала в
      // доступе), а .catch() ловит то, что вообще не успело дойти до
      // ответа (сеть недоступна, сам клиент бросил исключение) — без
      // него страница осталась бы в состоянии "Загружаю…" навсегда,
      // вместо явного "не удалось загрузить".
      .catch(() => { if (myId === requestId.current) { setError(true); setLoading(false); } });
  }, [query, role]);

  function loadMore() {
    setLoadingMore(true);
    const supabase = createClient();
    searchProfiles(supabase, { query, role, limit: PEOPLE_PAGE_SIZE, offset: profiles.length })
      .then(async ({ data, count: total, error: err }) => {
        setLoadingMore(false);
        if (err) return;
        setProfiles((prev) => [...prev, ...data]);
        setCount(total);
        if (data.length > 0) {
          const { data: streaks } = await supabase
            .from("user_streaks")
            .select("user_id, total_points, total_solved, current_streak, longest_streak")
            .in("user_id", data.map((p) => p.id));
          const map: Record<string, number> = {};
          (streaks as (RowStats & { user_id: string })[] | null)?.forEach((s) => {
            map[s.user_id] = scoreFromRow(s);
          });
          setScores((prev) => ({ ...prev, ...map }));
        }
      })
      .catch(() => setLoadingMore(false));
  }

  const hasMore = count !== null && profiles.length < count;

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-text-primary">
          {isRu ? "Люди" : "People"}
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-text-secondary">
          {isRu
            ? "Публичные профили участников Wrench-Branch — QA-инженеры, frontend и backend разработчики."
            : "Public profiles of Wrench-Branch members — QA engineers, frontend and backend developers."}
        </p>
      </div>

      {/* Поиск */}
      <div className="mb-4 flex items-center gap-3 rounded-lg border border-border bg-surface px-3.5 py-2.5">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="shrink-0 text-text-muted" aria-hidden>
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          placeholder={isRu ? "Имя или username…" : "Name or username…"}
          className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
        />
      </div>

      {/* Фильтр по роли */}
      <div className="mb-6 flex flex-wrap gap-1.5">
        <button onClick={() => setRole("all")}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            role === "all" ? "border-accent/40 bg-accent/10 text-accent" : "border-border text-text-muted hover:text-text-secondary"
          }`}>
          {isRu ? "Все" : "All"}
        </button>
        {ROLE_TAGS.map((r) => (
          <button key={r.id} onClick={() => setRole(r.id)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              role === r.id ? "border-accent/40 bg-accent/10 text-accent" : "border-border text-text-muted hover:text-text-secondary"
            }`}>
            {isRu ? r.labelRu : r.label}
          </button>
        ))}
      </div>

      {/* Результаты */}
      {error ? (
        <p className="py-12 text-center text-sm text-text-muted">
          {isRu ? "Не удалось загрузить список. Попробуй обновить страницу." : "Couldn't load the list. Try refreshing the page."}
        </p>
      ) : loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => <PersonCardSkeleton key={i} />)}
        </div>
      ) : profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-3 text-text-muted"><GameIcon id="magnifier" size={30} /></div>
          <h3 className="text-base font-semibold text-text-primary">
            {isRu ? "Никого не нашли" : "No one found"}
          </h3>
          <p className="mt-2 text-sm text-text-muted">
            {isRu ? "Попробуй другой запрос или сними фильтр по роли." : "Try a different search term or clear the role filter."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {profiles.map((p) => (
              <PersonCard key={p.id} locale={locale} profile={p} score={scores[p.id] ?? 0} />
            ))}
          </div>
          {hasMore && (
            <div className="mt-6 flex justify-center">
              <button onClick={loadMore} disabled={loadingMore}
                className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-surface disabled:opacity-60">
                {loadingMore ? (isRu ? "Загружаю…" : "Loading…") : (isRu ? "Показать ещё" : "Load more")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
