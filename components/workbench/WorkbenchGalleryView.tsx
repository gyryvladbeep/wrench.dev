"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { useWorkbenches } from "@/lib/hooks/useWorkbenches";
import { createClient } from "@/lib/supabase/client";
import { localePath, Locale } from "@/lib/i18n/config";
import { allTools } from "@/lib/tools-registry";
import { localizeTool } from "@/lib/i18n/localize";
import { WORKBENCH_UI, formatWorkbenchString } from "@/lib/i18n/workbench-content";
import { AvatarGlyph } from "@/components/profile/AvatarGlyph";
import { GameIcon } from "@/components/icons/GameIcons";
import { ToolPosition } from "@/lib/workbench-layout";

// Та же логика постраничной подгрузки, что уже применена в
// PeopleDirectory.tsx (count: "exact" + range()), только без поиска и
// фильтра по роли — тут всего два сортирующих режима.
const GALLERY_PAGE_SIZE = 12;

type Sort = "popular" | "newest";

interface GalleryRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  tool_slugs: string[];
  layout: Record<string, ToolPosition>;
  clone_count: number;
}

interface OwnerProfile {
  username: string;
  display_name: string;
  avatar_color: string;
  avatar_emblem: string | null;
}

type CloneState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; truncated: boolean }
  | { kind: "error" };

export function WorkbenchGalleryView({ locale }: { locale: Locale }) {
  const t = WORKBENCH_UI[locale];
  const { user } = useAuth();
  const { isPro } = useSubscription();
  // Один хук на всю галерею (не на карточку) — собственные workbench'и
  // пользователя нужны только чтобы знать лимит free/Pro для кнопок
  // клонирования на каждой карточке, а clonewbench сам делает insert.
  const { workbenches: myWorkbenches, loading: myWbLoading, maxWorkbenches, maxToolsPerWorkbench, cloneWorkbench } = useWorkbenches(isPro);

  const [sort, setSort]                 = useState<Sort>("popular");
  const [rows, setRows]                 = useState<GalleryRow[]>([]);
  // undefined = профиль ещё не запрашивали, null = запросили, но RLS не
  // вернула строку (приватный профиль или анонимный автор) — тот же
  // принцип "loading" vs "anonymous", что в PublicWorkbenchView.tsx, но
  // по карте id → профиль, а не по одному значению.
  const [owners, setOwners]             = useState<Record<string, OwnerProfile | null>>({});
  const [count, setCount]               = useState<number | null>(null);
  const [loading, setLoading]           = useState(true);
  const [loadingMore, setLoadingMore]   = useState(false);
  const [error, setError]               = useState(false);
  const [cloneStates, setCloneStates]   = useState<Record<string, CloneState>>({});

  const fetchOwners = useCallback(async (userIds: string[]) => {
    const unique = Array.from(new Set(userIds));
    if (unique.length === 0) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_color, avatar_emblem")
      .in("id", unique);
    const map: Record<string, OwnerProfile | null> = {};
    unique.forEach((id) => { map[id] = null; });
    (data as (OwnerProfile & { id: string })[] | null)?.forEach((p) => { map[p.id] = p; });
    setOwners((prev) => ({ ...prev, ...map }));
  }, []);

  // Общий билдер запроса для первой страницы и "показать ещё" — единственная
  // разница между ними это range(). Обёрнут в try/catch (а не только
  // { error } из ответа) в обеих точках вызова: .order().order().range()
  // цепочка предполагает настоящий supabase-js клиент (он всегда
  // возвращает thenable query builder на каждом шаге); без .env.local
  // клиент — заглушка (см. lib/supabase/client.ts) с гораздо более
  // простой формой ответа, и на реальном проде эта же защита не даст
  // упасть всей странице, если сеть до Supabase недоступна.
  function buildQuery(from: number, to: number) {
    const supabase = createClient();
    let query = supabase
      .from("workbenches")
      .select("id, user_id, name, description, tool_slugs, layout, clone_count", { count: "exact" })
      .eq("is_public", true);
    query = sort === "popular"
      ? query.order("clone_count", { ascending: false }).order("created_at", { ascending: false })
      : query.order("created_at", { ascending: false });
    return query.range(from, to);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setRows([]);
    setCount(null);

    (async () => {
      try {
        // Ни одна доп. фильтрация не нужна — RLS-политика
        // workbenches_select_public (см. workbench-schema.sql) уже отдаёт
        // только is_public = true строки анонимному посетителю, тот же
        // принцип, что в PublicWorkbenchView.tsx. eq("is_public", true) тут
        // добавлен просто как явное намерение запроса, а не как замена RLS.
        const { data, count: total, error: err } = await buildQuery(0, GALLERY_PAGE_SIZE - 1) as
          { data: GalleryRow[] | null; count: number | null; error: unknown };
        if (cancelled) return;
        if (err || !data) { setError(true); setLoading(false); return; }
        setRows(data);
        setCount(total ?? data.length);
        setLoading(false);
        fetchOwners(data.map((r) => r.user_id));
      } catch {
        if (!cancelled) { setError(true); setLoading(false); }
      }
    })();

    return () => { cancelled = true; };
  }, [sort, fetchOwners]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const { data, count: total, error: err } = await buildQuery(rows.length, rows.length + GALLERY_PAGE_SIZE - 1) as
        { data: GalleryRow[] | null; count: number | null; error: unknown };
      setLoadingMore(false);
      if (err || !data) return;
      setRows((prev) => [...prev, ...data]);
      setCount(total ?? null);
      fetchOwners(data.map((r) => r.user_id));
    } catch {
      setLoadingMore(false);
    }
  }

  async function handleClone(row: GalleryRow) {
    if (cloneStates[row.id]?.kind === "loading") return;
    setCloneStates((prev) => ({ ...prev, [row.id]: { kind: "loading" } }));
    const nameSuffix = locale === "ru" ? " (копия)" : " (copy)";
    const result = await cloneWorkbench(
      { id: row.id, name: row.name, tool_slugs: row.tool_slugs, layout: row.layout },
      nameSuffix
    );
    if (!result.workbench) { setCloneStates((prev) => ({ ...prev, [row.id]: { kind: "error" } })); return; }
    setCloneStates((prev) => ({ ...prev, [row.id]: { kind: "success", truncated: result.truncated } }));
  }

  const hasMore = count !== null && rows.length < count;
  const atLimit = !myWbLoading && myWorkbenches.length >= maxWorkbenches;

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-text-primary">{t.galleryPageTitle}</h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-text-secondary">{t.galleryPageSubtitle}</p>
      </div>

      <div className="mb-6 flex gap-1.5">
        <button
          onClick={() => setSort("popular")}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            sort === "popular" ? "border-accent/40 bg-accent/10 text-accent" : "border-border text-text-muted hover:text-text-secondary"
          }`}
        >
          {t.gallerySortPopular}
        </button>
        <button
          onClick={() => setSort("newest")}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            sort === "newest" ? "border-accent/40 bg-accent/10 text-accent" : "border-border text-text-muted hover:text-text-secondary"
          }`}
        >
          {t.gallerySortNewest}
        </button>
      </div>

      {error ? (
        <p className="py-12 text-center text-sm text-text-muted">
          {locale === "ru"
            ? "Не удалось загрузить галерею. Попробуй обновить страницу."
            : "Couldn't load the gallery. Try refreshing the page."}
        </p>
      ) : loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-surface p-4">
              <div className="h-4 w-2/3 animate-pulse rounded bg-surface-hover" />
              <div className="mt-2 h-3 w-full animate-pulse rounded bg-surface-hover" />
              <div className="mt-4 h-8 w-full animate-pulse rounded bg-surface-hover" />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-3 text-text-muted"><GameIcon id="wrench" size={30} /></div>
          <p className="text-sm text-text-muted">{t.galleryEmpty}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {rows.map((row) => {
              const owner = owners[row.user_id];
              const ownerLoaded = row.user_id in owners;
              const tools = row.tool_slugs
                .map((slug) => allTools.find((tool) => tool.slug === slug))
                .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool))
                .map((tool) => localizeTool(tool, locale));
              const cloneState = cloneStates[row.id] ?? { kind: "idle" as const };

              return (
                <div key={row.id} className="flex flex-col rounded-lg border border-border bg-surface p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate text-sm font-semibold text-text-primary">{row.name}</h3>
                    <span className="shrink-0 text-2xs text-text-muted">
                      {formatWorkbenchString(t.galleryClonesCount, { n: row.clone_count })}
                    </span>
                  </div>

                  {row.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-text-secondary">{row.description}</p>
                  )}

                  {ownerLoaded && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-text-muted">
                      <span>{t.galleryByLabel}</span>
                      {owner ? (
                        <Link
                          href={localePath(locale, `/u/${owner.username}`)}
                          className="flex items-center gap-1 font-medium text-text-secondary transition-colors hover:text-accent"
                        >
                          <AvatarGlyph
                            color={owner.avatar_color}
                            emblemId={owner.avatar_emblem}
                            initials={(owner.display_name || owner.username)[0].toUpperCase()}
                            sizeClass="h-4 w-4 text-[8px]"
                          />
                          {owner.display_name || owner.username}
                        </Link>
                      ) : (
                        <span>{t.galleryAnonymousOwner}</span>
                      )}
                    </div>
                  )}

                  {tools.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {tools.slice(0, 4).map((tool) => (
                        <span key={tool.slug} className="rounded border border-border px-1.5 py-px text-[10px] text-text-muted">
                          {tool.name}
                        </span>
                      ))}
                      {tools.length > 4 && (
                        <span className="rounded border border-border px-1.5 py-px text-[10px] text-text-muted">
                          +{tools.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  <p className="mt-2 text-2xs text-text-muted">
                    {formatWorkbenchString(t.galleryToolsCount, { n: row.tool_slugs.length })}
                  </p>

                  <div className="mt-auto flex items-center gap-2 pt-3">
                    <Link
                      href={localePath(locale, `/w/${row.id}`)}
                      className="flex-1 rounded border border-border px-3 py-1.5 text-center text-xs font-medium text-text-secondary transition-colors hover:bg-surface-hover"
                    >
                      {t.galleryViewButton}
                    </Link>

                    {!user ? (
                      <Link
                        href={localePath(locale, "/auth/login")}
                        className="flex-1 rounded bg-accent px-3 py-1.5 text-center text-xs font-medium text-accent-fg transition-colors hover:bg-amber-400"
                      >
                        {t.cloneButtonSignedOut}
                      </Link>
                    ) : cloneState.kind === "success" ? (
                      <Link
                        href={localePath(locale, "/workbench")}
                        className="flex-1 rounded border border-accent/40 bg-accent/10 px-3 py-1.5 text-center text-xs font-medium text-accent"
                      >
                        {t.cloneSuccessCta}
                      </Link>
                    ) : atLimit ? (
                      <span className="flex-1 text-center text-2xs text-text-muted">{t.cloneLimitReached}</span>
                    ) : (
                      <button
                        onClick={() => handleClone(row)}
                        disabled={cloneState.kind === "loading"}
                        className="flex-1 rounded bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg transition-colors hover:bg-amber-400 disabled:opacity-60"
                      >
                        {t.cloneButton}
                      </button>
                    )}
                  </div>

                  {cloneState.kind === "error" && (
                    <p className="mt-1.5 text-2xs text-red-400">{t.cloneError}</p>
                  )}
                  {cloneState.kind === "success" && cloneState.truncated && (
                    <p className="mt-1.5 text-2xs text-amber-500">
                      {formatWorkbenchString(t.cloneTruncatedNotice, { max: maxToolsPerWorkbench })}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {hasMore && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-surface disabled:opacity-60"
              >
                {loadingMore ? (locale === "ru" ? "Загружаю…" : "Loading…") : t.galleryLoadMore}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
