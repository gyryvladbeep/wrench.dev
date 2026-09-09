"use client";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { WorkbenchCanvas } from "@/components/workbench/WorkbenchCanvas";
import { WORKBENCH_UI, formatWorkbenchString } from "@/lib/i18n/workbench-content";
import { GameIcon } from "@/components/icons/GameIcons";
import { CopyButton } from "@/components/CopyButton";

// Высота шапки сайта (см. Header.tsx: "h-12" + border-b) — используется
// ниже, чтобы холст занимал ровно весь вьюпорт под шапкой, а не
// произвольный кусок страницы.
const HEADER_HEIGHT = 49;
const CANVAS_FALLBACK_HEIGHT = 480;
// Стартовая оценка размера плавающей панели — используется как
// запретный угол для карточек ДО того, как ResizeObserver впервые
// измерит панель по-настоящему (см. panelRect ниже). Без стартового
// значения первый кадр отрендерил бы карточки без учёта панели вообще,
// и они бы на мгновение мелькнули под ней, а потом дёрнулись вниз.
const INITIAL_PANEL_ESTIMATE = { width: 540, height: 230 };

export default function WorkbenchPage() {
  const { user, loading, isSigningOut } = useAuth();
  const { dict, locale } = useDict();
  const router = useRouter();
  const isRu = locale === "ru";
  const { isPro } = useSubscription();
  const {
    workbenches, loading: wbLoading, maxWorkbenches, maxToolsPerWorkbench,
    createWorkbench, renameWorkbench, deleteWorkbench, addTool, removeTool, moveTool, resizeTool, setPublic,
    reorderWorkbenches,
  } = useWorkbenches(isPro);

  const t = WORKBENCH_UI[locale];

  const [activeId, setActiveId]           = useState<string | null>(null);
  const [pickerOpen, setPickerOpen]       = useState(false);
  const [renamingId, setRenamingId]       = useState<string | null>(null);
  const [nameDraft, setNameDraft]         = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Попап "Поделиться" — тот же паттерн клика-вне (ref + mousedown-обработчик
  // на document), что уже используется в AvatarMenu из Header.tsx.
  const [shareOpen, setShareOpen] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  // Плавающая панель измеряет сама себя — карточки на холсте не должны
  // рождаться (и не должны застревать после драга) у неё под низом,
  // иначе полностью закрытая панелью карточка была бы не видна и
  // недоступна для клика (см. avoidTopLeft в WorkbenchCanvas). ResizeObserver,
  // а не разовое измерение — ширина/высота панели меняется вместе с
  // количеством вкладок и длиной их названий (перенос строк).
  const panelRef = useRef<HTMLDivElement>(null);
  // Храним запретный угол сразу в координатах холста (не сырые
  // width/height панели) — getBoundingClientRect() даёт углы панели во
  // viewport-координатах; canvas-local x=0 совпадает с viewport x=0
  // (у холста нет отступа слева), а canvas-local y=0 — это viewport
  // y=HEADER_HEIGHT (холст начинается сразу под шапкой). Так измерение
  // не завязано на конкретные "left-4"/"top-[60px]" панели — если её
  // позиционирование когда-то поменяется, тут ничего трогать не придётся.
  const [avoidTopLeft, setAvoidTopLeft] = useState({
    width: INITIAL_PANEL_ESTIMATE.width,
    height: INITIAL_PANEL_ESTIMATE.height,
  });
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    function measure() {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setAvoidTopLeft({ width: rect.right, height: Math.max(0, rect.bottom - HEADER_HEIGHT) });
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, []);

  useEffect(() => {
    if (!shareOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShareOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setShareOpen(false); }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [shareOpen]);

  // Высота вьюпорта — холст должен занимать всю страницу под шапкой сразу,
  // а не только когда в нём уже полно карточек (см. WorkbenchCanvas'ин
  // minHeight). window недоступен на сервере, поэтому 0 до первого
  // эффекта — страница всё равно не рендерит холст, пока !user || wbLoading,
  // так что серверный/клиентский рендер тут не расходятся (гидратация).
  const [viewportHeight, setViewportHeight] = useState(0);
  useEffect(() => {
    function update() { setViewportHeight(window.innerHeight); }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Перетаскивание вкладок рабочих столов — тот же нативный HTML5 drag &
  // drop, что уже используется для карточек инструментов в WorkbenchCanvas
  // (см. её комментарий про выбор в пользу нативного API без библиотек).
  // Здесь состояние живёт прямо в странице, а не в отдельном компоненте —
  // вкладок мало (максимум 5 у Pro) и вся разметка тут же, в одном месте.
  const [draggedWorkspaceId, setDraggedWorkspaceId] = useState<string | null>(null);
  const [overWorkspaceId, setOverWorkspaceId]       = useState<string | null>(null);

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
  // window недоступен при первом серверном рендере "use client"-страницы —
  // ссылка нужна только внутри уже открытого попапа "Поделиться", то есть
  // после монтирования в браузере, так что простой guard достаточен и не
  // требует отдельного useEffect + состояния только ради одной строки.
  const shareUrl = active && typeof window !== "undefined"
    ? `${window.location.origin}${localePath(locale, `/w/${active.id}`)}`
    : "";
  const canvasMinHeight = Math.max(CANVAS_FALLBACK_HEIGHT, viewportHeight - HEADER_HEIGHT);

  function commitRename(id: string, fallback: string) {
    renameWorkbench(id, nameDraft.trim() || fallback);
    setRenamingId(null);
  }

  // confirmDeleteId раньше переживал переключение вкладки — начал
  // удаление одного рабочего стола, передумал, кликнул на другую
  // вкладку, вернулся обратно к первой — и видел "Удалить это
  // пространство?" снова, БЕЗ повторного клика на "Удалить". Сбрасываем
  // подтверждение при каждом переключении активного рабочего стола, а
  // не только там, где оно явно закрывается (Cancel/подтверждённое
  // удаление) — так предупреждение никогда не переживает смену вкладки.
  function switchWorkspace(id: string) {
    setActiveId(id);
    setConfirmDeleteId(null);
  }

  function handleWorkspaceDrop(targetId: string) {
    if (!draggedWorkspaceId || draggedWorkspaceId === targetId) {
      setDraggedWorkspaceId(null); setOverWorkspaceId(null); return;
    }
    const current = workbenches.map((w) => w.id);
    const from = current.indexOf(draggedWorkspaceId);
    const to   = current.indexOf(targetId);
    if (from === -1 || to === -1) { setDraggedWorkspaceId(null); setOverWorkspaceId(null); return; }
    const next = [...current];
    next.splice(from, 1);
    next.splice(to, 0, draggedWorkspaceId);
    reorderWorkbenches(next);
    setDraggedWorkspaceId(null);
    setOverWorkspaceId(null);
  }

  return (
    <div className="relative w-full">
      {/* ═══════════════════════════════════════════════════════
          Плавающая панель — вкладки рабочих столов + все действия
          над ними. Раньше это был обычный блок в потоке страницы,
          выше самой сетки; теперь холст занимает страницу целиком,
          так что панель "плавает" поверх него отдельным окном
          (fixed, со своей рамкой и тенью), а не толкает его вниз. */}
      <div
        ref={panelRef}
        className="fixed left-4 top-[60px] z-30 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-surface/95 p-4 shadow-lg backdrop-blur-md"
      >
        <h1 className="mb-3 text-base font-bold text-text-primary">{t.pageTitle}</h1>

        {/* Workspace tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {workbenches.map((wb) => (
            <div
              key={wb.id}
              // Перетаскивать можно только саму вкладку, не поле переименования —
              // иначе drag мешал бы выделять текст курсором внутри input.
              draggable={renamingId !== wb.id}
              onDragStart={() => setDraggedWorkspaceId(wb.id)}
              onDragOver={(e) => { e.preventDefault(); if (overWorkspaceId !== wb.id) setOverWorkspaceId(wb.id); }}
              onDragLeave={() => setOverWorkspaceId((id) => (id === wb.id ? null : id))}
              onDrop={(e) => { e.preventDefault(); handleWorkspaceDrop(wb.id); }}
              onDragEnd={() => { setDraggedWorkspaceId(null); setOverWorkspaceId(null); }}
              className={`rounded-lg transition-opacity ${draggedWorkspaceId === wb.id ? "opacity-40" : ""} ${
                overWorkspaceId === wb.id && draggedWorkspaceId && draggedWorkspaceId !== wb.id
                  ? "ring-2 ring-accent"
                  : ""
              }`}
            >
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
                  onClick={() => switchWorkspace(wb.id)}
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
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3">
            <button
              onClick={() => setPickerOpen(true)}
              className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg transition-colors hover:bg-amber-400"
            >
              {t.addTool}
            </button>
            <span className="text-xs text-text-muted">
              {active.tool_slugs.length}/{maxToolsPerWorkbench} {t.toolsCountSuffix}
            </span>

            <div className="relative ml-auto flex items-center gap-3" ref={shareRef}>
              <button
                onClick={() => setShareOpen((v) => !v)}
                className={`rounded border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active.is_public
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : "border-border bg-surface text-text-muted hover:bg-surface-hover hover:text-text-secondary"
                }`}
              >
                {t.shareButton}
              </button>
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

              {shareOpen && (
                <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-xl border border-border bg-surface p-4 shadow-lg animate-scale-in">
                  <p className="text-sm font-medium text-text-primary">{t.sharePanelTitle}</p>

                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-text-secondary">{t.sharePublicLabel}</p>
                      <p className="mt-0.5 text-xs text-text-muted">{t.sharePublicHint}</p>
                    </div>
                    <button
                      role="switch"
                      aria-checked={active.is_public}
                      aria-label={t.sharePublicLabel}
                      onClick={() => setPublic(active.id, !active.is_public)}
                      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${active.is_public ? "bg-accent" : "bg-surface-hover"}`}
                    >
                      {/* left-0.5 закрепляет базовую позицию бегунка явно — без
                          неё (как было раньше) абсолютно спозиционированный
                          span без left/right получает "статическую позицию"
                          по вычислению браузера, а не 0: на практике здесь
                          она оказывалась около 18px, а не 0. В выключенном
                          состоянии сдвиг на translate-x-0.5 поверх этого был
                          почти незаметен, но во включённом состоянии
                          translate-x-[18px] поверх той же базы уводил бегунок
                          на 36px от левого края — то есть на всю ширину
                          дорожки (36px) плюс собственная ширина, и он
                          заметно вылезал за правый край дорожки. */}
                      <span
                        className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-text-primary transition-transform ${
                          active.is_public ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {active.is_public && (
                    <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-border bg-canvas px-2.5 py-1.5">
                      <span className="min-w-0 flex-1 truncate font-mono text-xs text-text-secondary">{shareUrl}</span>
                      <CopyButton value={shareUrl} iconOnly />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          Сам холст — вся страница под шапкой целиком, от самого верха:
          панель выше плавает НАД ним (fixed, не занимает место в
          потоке), а не толкает его вниз. Точечный фон виден сразу под
          панелью и по всей странице, а не только когда в рабочем столе
          уже что-то есть. Единственная поправка — avoidTopLeft ниже:
          холст сам не даёт карточкам оказаться под панелью, где их не
          было бы видно и нечем было бы кликнуть. */}
      {active && (
        <div className="relative w-full">
          <WorkbenchCanvas
            tools={activeTools}
            layout={active.layout}
            dict={dict}
            locale={locale}
            onRemove={(slug) => removeTool(active.id, slug)}
            onMove={(slug, position) => moveTool(active.id, slug, position)}
            onResize={(slug, size) => resizeTool(active.id, slug, size)}
            minHeight={canvasMinHeight}
            bordered={false}
            avoidTopLeft={avoidTopLeft}
          />

          {activeTools.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
              <div className="pointer-events-auto max-w-sm rounded-lg border border-border bg-surface p-10 text-center shadow-lg">
                <div className="mb-3 flex justify-center text-text-muted"><GameIcon id="wrench" size={28} /></div>
                <p className="font-medium text-text-secondary">{t.emptyTitle}</p>
                <p className="mt-2 text-sm text-text-muted">{t.emptyBody}</p>
                <button
                  onClick={() => setPickerOpen(true)}
                  className="mt-4 inline-block rounded bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-amber-400"
                >
                  {t.browseTools}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {active && (
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
      )}
    </div>
  );
}
