"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useDict } from "@/lib/i18n/dict-context";
import { localePath } from "@/lib/i18n/config";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { useWorkbenches } from "@/lib/hooks/useWorkbenches";
import { allTools } from "@/lib/tools-registry";
import { localizeTool } from "@/lib/i18n/localize";
import { ToolPickerModal } from "@/components/workbench/ToolPickerModal";
import { WorkbenchGrid } from "@/components/workbench/WorkbenchGrid";
import { WORKBENCH_UI, formatWorkbenchString } from "@/lib/i18n/workbench-content";

export default function WorkbenchPage() {
  const { user, loading, isSigningOut } = useAuth();
  const { dict, locale } = useDict();
  const router = useRouter();
  const isRu = locale === "ru";
  const { isPro } = useSubscription();
  const {
    workbenches, loading: wbLoading, maxWorkbenches, maxToolsPerWorkbench,
    createWorkbench, renameWorkbench, deleteWorkbench, addTool, removeTool, reorderTools,
  } = useWorkbenches(isPro);

  const t = WORKBENCH_UI[locale];

  const [activeId, setActiveId]           = useState<string | null>(null);
  const [pickerOpen, setPickerOpen]       = useState(false);
  const [renamingId, setRenamingId]       = useState<string | null>(null);
  const [nameDraft, setNameDraft]         = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Тот же приём, что и в /profile: ждём именно loading из useAuth(),
  // а не свой локальный "hydrated" флаг. См. подробный разбор гонки
  // состояний в комментарии app/[locale]/profile/page.tsx — та же
  // логика защищает и эту страницу.
  useEffect(() => {
    if (loading) return;
    if (!user) {
      if (!isSigningOut()) router.push(localePath(locale, "/auth/login"));
    }
  }, [user, loading, router, locale, isSigningOut]);

  // Держим activeId синхронизированным со списком workbench'ей — если
  // текущий выбранный удалили (или список только что загрузился),
  // переключаемся на первый доступный.
  useEffect(() => {
    if (workbenches.length === 0) { setActiveId(null); return; }
    if (!activeId || !workbenches.some((w) => w.id === activeId)) {
      setActiveId(workbenches[0].id);
    }
  }, [workbenches, activeId]);

  const active = workbenches.find((w) => w.id === activeId) ?? null;

  const activeTools = useMemo(() => {
    if (!active) return [];
    return active.tool_slugs
      .map((slug) => allTools.find((tool) => tool.slug === slug))
      .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool))
      .map((tool) => localizeTool(tool, locale));
  }, [active, locale]);

  if (!user || wbLoading) return null;

  const canCreateWorkspace = workbenches.length < maxWorkbenches;

  function commitRename(id: string, fallback: string) {
    renameWorkbench(id, nameDraft.trim() || fallback);
    setRenamingId(null);
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">{t.pageTitle}</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-text-secondary">{t.pageSubtitle}</p>
      </div>

      {/* Workspace tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {workbenches.map((wb) => (
          <div key={wb.id}>
            {renamingId === wb.id ? (
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={() => commitRename(wb.id, wb.name)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename(wb.id, wb.name);
                  if (e.key === "Escape") setRenamingId(null);
                }}
                className="code-surface rounded-lg px-3 py-1.5 text-sm text-text-primary outline-none"
              />
            ) : (
              <button
                onClick={() => setActiveId(wb.id)}
                onDoubleClick={() => { setRenamingId(wb.id); setNameDraft(wb.name); }}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  activeId === wb.id
                    ? "bg-accent/15 font-medium text-accent"
                    : "border border-border bg-surface text-text-muted hover:bg-surface-hover"
                }`}
              >
                {wb.name}
              </button>
            )}
          </div>
        ))}

        {canCreateWorkspace ? (
          <button
            onClick={() => createWorkbench(isRu ? "Новое пространство" : "New workspace")}
            className="rounded-lg border border-dashed border-border px-3 py-1.5 text-sm text-text-muted transition-colors hover:border-border-focus hover:text-text-secondary"
          >
            {t.newWorkspace}
          </button>
        ) : (
          <span className="text-xs text-text-muted">
            {formatWorkbenchString(t.limitWorkspacesReached, { max: maxWorkbenches })}
            {!isPro && (
              <Link href={localePath(locale, "/pro")} className="ml-1.5 font-medium text-link hover:underline">
                {t.upgradeToPro}
              </Link>
            )}
          </span>
        )}
      </div>

      {active && (
        <>
          {/* Toolbar */}
          <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-border pb-4">
            <button
              onClick={() => setPickerOpen(true)}
              className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg transition-colors hover:bg-amber-400"
            >
              {t.addTool}
            </button>
            <span className="text-xs text-text-muted">
              {active.tool_slugs.length}/{maxToolsPerWorkbench} {t.toolsCountSuffix}
            </span>

            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={() => { setRenamingId(active.id); setNameDraft(active.name); }}
                className="text-xs text-text-muted transition-colors hover:text-text-secondary"
              >
                {t.rename}
              </button>
              {confirmDeleteId === active.id ? (
                <span className="flex items-center gap-2 text-xs">
                  <span className="text-text-muted">{t.deleteConfirmTitle}</span>
                  <button
                    onClick={() => { deleteWorkbench(active.id); setConfirmDeleteId(null); }}
                    className="font-medium text-red-400 hover:underline"
                  >
                    {t.confirmDelete}
                  </button>
                  <button onClick={() => setConfirmDeleteId(null)} className="text-text-muted hover:underline">
                    {t.cancel}
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setConfirmDeleteId(active.id)}
                  className="text-xs text-text-muted transition-colors hover:text-red-400"
                >
                  {t.delete}
                </button>
              )}
            </div>
          </div>

          {activeTools.length === 0 ? (
            <div className="rounded-lg border border-border bg-surface p-10 text-center">
              <p className="mb-3 text-2xl">🧰</p>
              <p className="font-medium text-text-secondary">{t.emptyTitle}</p>
              <p className="mt-2 text-sm text-text-muted">{t.emptyBody}</p>
              <button
                onClick={() => setPickerOpen(true)}
                className="mt-4 inline-block rounded bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-amber-400"
              >
                {t.browseTools}
              </button>
            </div>
          ) : (
            <WorkbenchGrid
              tools={activeTools}
              dict={dict}
              locale={locale}
              onRemove={(slug) => removeTool(active.id, slug)}
              onReorder={(order) => reorderTools(active.id, order)}
            />
          )}

          <ToolPickerModal
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            locale={locale}
            addedSlugs={active.tool_slugs}
            maxTools={maxToolsPerWorkbench}
            isPro={isPro}
            onToggle={(slug) => {
              if (active.tool_slugs.includes(slug)) removeTool(active.id, slug);
              else addTool(active.id, slug);
            }}
          />
        </>
      )}
    </div>
  );
}
