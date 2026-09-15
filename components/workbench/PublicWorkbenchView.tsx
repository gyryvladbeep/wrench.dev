"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { useWorkbenches } from "@/lib/hooks/useWorkbenches";
import { createClient } from "@/lib/supabase/client";
import { useDict } from "@/lib/i18n/dict-context";
import { localePath, Locale } from "@/lib/i18n/config";
import { allTools } from "@/lib/tools-registry";
import { localizeTool } from "@/lib/i18n/localize";
import { WorkbenchCanvas } from "@/components/workbench/WorkbenchCanvas";
import { WORKBENCH_UI, formatWorkbenchString } from "@/lib/i18n/workbench-content";
import { GameIcon } from "@/components/icons/GameIcons";
import { AvatarGlyph } from "@/components/profile/AvatarGlyph";
import { ToolPosition } from "@/lib/workbench-layout";

interface PublicWorkbench {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  tool_slugs: string[];
  layout: Record<string, ToolPosition>;
}

interface OwnerProfile {
  username: string;
  display_name: string;
  avatar_color: string;
  avatar_emblem: string | null;
}

interface PublicWorkbenchViewProps {
  locale: Locale;
  id: string;
}

// "не найдено" покрывает три разных случая одной и той же надписью:
// строка не существует, чужой приватный workbench, автор выключил шаринг
// после того, как ссылку кому-то отправили. Разбирать их по отдельности
// не нужно и даже вредно — это ничего не даёт зрителю по ссылке, а вот
// "это приватный стол другого юзера" звучало бы как утечка информации о
// том, что id вообще существует в базе.
type ViewState = { kind: "loading" } | { kind: "not-found" } | { kind: "found"; workbench: PublicWorkbench };

// Автор — отдельное, независимое состояние от самого workbench: даже
// когда сам стол публичный, профиль его владельца мог остаться приватным
// (is_public у profiles и у workbenches — два независимых флага, см.
// комментарий в useWorkbenches.ts/profile-schema.sql). "loading" не даёт
// имени на миг мигнуть "анонимом", пока запрос ещё летит.
type OwnerState = { kind: "loading" } | { kind: "anonymous" } | { kind: "found"; profile: OwnerProfile };

type CloneState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; truncated: boolean }
  | { kind: "error" };

export function PublicWorkbenchView({ locale, id }: PublicWorkbenchViewProps) {
  const { dict } = useDict();
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const { workbenches: myWorkbenches, loading: myWbLoading, maxWorkbenches, maxToolsPerWorkbench, cloneWorkbench } = useWorkbenches(isPro);
  const t = WORKBENCH_UI[locale];
  const [state, setState] = useState<ViewState>({ kind: "loading" });
  const [owner, setOwner] = useState<OwnerState>({ kind: "loading" });
  const [cloneState, setCloneState] = useState<CloneState>({ kind: "idle" });

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "loading" });
    setOwner({ kind: "loading" });
    setCloneState({ kind: "idle" });

    // Фильтруем только по id, а не ещё и по is_public — эту часть уже
    // делает RLS-политика workbenches_select_public (is_public = true) на
    // стороне базы (см. supabase/workbench-schema.sql): для анонимного
    // посетителя приватный ряд просто не существует в ответе, каким бы ни
    // был WHERE в самом запросе. Так и остальные запросы в этом проекте
    // (см. useWorkbenches.ts) доверяют RLS как единственному месту, где
    // проверяется доступ, а не дублируют проверку в JS.
    const supabase = createClient();
    supabase
      .from("workbenches")
      .select("id, user_id, name, description, tool_slugs, layout")
      .eq("id", id)
      .single()
      .then(({ data, error }: { data: PublicWorkbench | null; error: unknown }) => {
        if (cancelled) return;
        if (error || !data) { setState({ kind: "not-found" }); return; }
        setState({ kind: "found", workbench: data });

        // Автор мог оставить профиль приватным независимо от того, что сам
        // workbench публичный — тот же принцип "не найдено" из
        // PublicProfileView.tsx: запрос просто тихо не вернёт строку под
        // RLS, и мы падаем обратно на анонимную подпись, а не спрашиваем
        // явно "профиль скрыт" (это была бы утечка факта существования
        // строки в profiles).
        supabase
          .from("profiles")
          .select("username, display_name, avatar_color, avatar_emblem")
          .eq("id", data.user_id)
          .single()
          .then(({ data: profile }: { data: OwnerProfile | null }) => {
            if (cancelled) return;
            setOwner(profile ? { kind: "found", profile } : { kind: "anonymous" });
          });
      });

    return () => { cancelled = true; };
  }, [id]);

  if (state.kind === "loading") return null;

  if (state.kind === "not-found") {
    return (
      <div className="mx-auto max-w-lg px-5 py-16 text-center">
        <div className="mb-3 flex justify-center text-text-muted"><GameIcon id="wrench" size={28} /></div>
        <h1 className="text-lg font-semibold text-text-primary">{t.publicNotFoundTitle}</h1>
        <p className="mt-2 text-sm text-text-muted">{t.publicNotFoundBody}</p>
        <Link
          href={localePath(locale, "/")}
          className="mt-5 inline-block rounded bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-amber-400"
        >
          {t.publicCta}
        </Link>
      </div>
    );
  }

  const { workbench } = state;
  const tools = workbench.tool_slugs
    .map((slug) => allTools.find((tool) => tool.slug === slug))
    .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool))
    .map((tool) => localizeTool(tool, locale));

  async function handleClone() {
    if (cloneState.kind === "loading") return;
    setCloneState({ kind: "loading" });
    // " (copy)"/" (копия)" — не отдельная строка в WORKBENCH_UI: это
    // единственное место, где она нужна, и локальный isRu-тернарий
    // (тот же приём, что уже применён в самостоятельных инструментах
    // этой сессии) проще, чем расширять общий словарь фичи ради одной
    // короткой подписи.
    const nameSuffix = locale === "ru" ? " (копия)" : " (copy)";
    const result = await cloneWorkbench(
      { id: workbench.id, name: workbench.name, tool_slugs: workbench.tool_slugs, layout: workbench.layout },
      nameSuffix
    );
    if (!result.workbench) { setCloneState({ kind: "error" }); return; }
    setCloneState({ kind: "success", truncated: result.truncated });
  }

  const ownerName = owner.kind === "found" ? (owner.profile.display_name || owner.profile.username) : null;
  const atLimit = !myWbLoading && myWorkbenches.length >= maxWorkbenches;

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-text-primary">{workbench.name}</h1>
        <span className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-2xs font-medium uppercase tracking-wide text-text-muted">
          {t.publicBadge}
        </span>
      </div>

      {owner.kind !== "loading" && (
        <div className="mb-4 flex items-center gap-2 text-sm text-text-muted">
          <span>{t.galleryByLabel}</span>
          {owner.kind === "found" ? (
            <Link
              href={localePath(locale, `/u/${owner.profile.username}`)}
              className="flex items-center gap-1.5 font-medium text-text-secondary transition-colors hover:text-accent"
            >
              <AvatarGlyph
                color={owner.profile.avatar_color}
                emblemId={owner.profile.avatar_emblem}
                initials={(ownerName || "?")[0].toUpperCase()}
                sizeClass="h-6 w-6 text-[10px]"
              />
              {ownerName}
            </Link>
          ) : (
            <span>{t.galleryAnonymousOwner}</span>
          )}
        </div>
      )}

      {workbench.description && (
        <p className="mb-6 max-w-2xl text-sm text-text-secondary">{workbench.description}</p>
      )}

      {/* ═══════════════════════════════════════════════════════
          Клонирование — тот же лимит free(1)/Pro(5) рабочих столов,
          что и обычное создание нового (createWorkbench), никакого
          отдельного лимита под клонирование не заведено (см.
          cloneWorkbench в useWorkbenches.ts). */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-4">
        {!user ? (
          <Link
            href={localePath(locale, "/auth/login")}
            className="rounded bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-amber-400"
          >
            {t.cloneButtonSignedOut}
          </Link>
        ) : cloneState.kind === "success" ? (
          <div>
            <p className="text-sm font-medium text-text-primary">{t.cloneSuccessTitle}</p>
            <p className="mt-0.5 text-xs text-text-muted">{t.cloneSuccessBody}</p>
            {cloneState.truncated && (
              <p className="mt-1 text-xs text-amber-500">
                {formatWorkbenchString(t.cloneTruncatedNotice, { max: maxToolsPerWorkbench })}
              </p>
            )}
            <Link
              href={localePath(locale, "/workbench")}
              className="mt-2 inline-block text-xs font-medium text-link hover:underline"
            >
              {t.cloneSuccessCta}
            </Link>
          </div>
        ) : atLimit ? (
          <p className="text-xs text-text-muted">{t.cloneLimitReached}</p>
        ) : (
          <div>
            <button
              onClick={handleClone}
              disabled={cloneState.kind === "loading"}
              className="rounded bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-amber-400 disabled:opacity-60"
            >
              {t.cloneButton}
            </button>
            {cloneState.kind === "error" && (
              <p className="mt-1.5 text-xs text-red-400">{t.cloneError}</p>
            )}
          </div>
        )}
      </div>

      {tools.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-10 text-center">
          <p className="text-sm text-text-muted">{t.publicEmptyBody}</p>
        </div>
      ) : (
        <WorkbenchCanvas tools={tools} layout={workbench.layout} dict={dict} locale={locale} readOnly />
      )}
    </div>
  );
}
