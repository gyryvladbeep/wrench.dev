"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Locale, localePath } from "@/lib/i18n/config";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { allTools, getPopularTools } from "@/lib/tools-registry";
import { localizeTool } from "@/lib/i18n/localize";
import { GUEST_MAX_TOOLS } from "@/lib/hooks/useWorkbenches";
import { ToolPickerModal } from "@/components/workbench/ToolPickerModal";
import { WorkbenchCanvas } from "@/components/workbench/WorkbenchCanvas";
import { GameIcon } from "@/components/icons/GameIcons";
import { ToolPosition, defaultToolPosition } from "@/lib/workbench-layout";

// Та же геометрия, что и в app/[locale]/workbench/page.tsx (HEADER_HEIGHT,
// CANVAS_FALLBACK_HEIGHT, INITIAL_PANEL_ESTIMATE) — продублирована, а не
// импортирована из page.tsx (это файл страницы, не модуль для переиспользования),
// чтобы гостевой холст визуально выглядел идентично настоящему.
const HEADER_HEIGHT = 49;
const CANVAS_FALLBACK_HEIGHT = 480;
const INITIAL_PANEL_ESTIMATE = { width: 420, height: 140 };

interface WorkbenchGuestPreviewProps {
  locale: Locale;
  dict: Dictionary;
}

// Гость раньше вообще не попадал на /workbench — редирект на /auth/login
// срабатывал ещё до первого рендера, даже для фичи без единого байта
// чувствительных данных. Этот компонент — локальный, полностью клиентский
// demo-холст: 3 популярных инструмента предзаполнены, дальше можно
// свободно двигать/менять/добавлять карточки (до GUEST_MAX_TOOLS), но
// состояние живёт только в памяти вкладки — ни одного запроса в Supabase,
// обновление страницы сбрасывает всё к дефолту. Задача не в том, чтобы
// дать гостю полноценный тариф без регистрации, а в том, чтобы показать
// саму фичу в деле — CTA "Зарегистрируйся, чтобы сохранить" всегда рядом.
export function WorkbenchGuestPreview({ locale, dict }: WorkbenchGuestPreviewProps) {
  const isRu = locale === "ru";

  const seedSlugs = useMemo(() => getPopularTools().slice(0, 3).map((t) => t.slug), []);
  const [toolSlugs, setToolSlugs] = useState<string[]>(seedSlugs);
  const [layout, setLayout] = useState<Record<string, ToolPosition>>(() =>
    Object.fromEntries(seedSlugs.map((slug, i) => [slug, defaultToolPosition(i)]))
  );
  const [pickerOpen, setPickerOpen] = useState(false);

  // toolSlugs может выйти за пределы seed-набора популярных инструментов —
  // ToolPickerModal позволяет добавить любой инструмент из полного
  // реестра, не только "популярный", поэтому ищем по allTools целиком.
  const activeTools = useMemo(
    () =>
      toolSlugs
        .map((slug) => allTools.find((t) => t.slug === slug))
        .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool))
        .map((tool) => localizeTool(tool, locale)),
    [toolSlugs, locale]
  );

  function addTool(slug: string) {
    if (toolSlugs.includes(slug) || toolSlugs.length >= GUEST_MAX_TOOLS) return;
    setLayout((prev) => ({ ...prev, [slug]: defaultToolPosition(toolSlugs.length) }));
    setToolSlugs((prev) => [...prev, slug]);
  }

  function removeTool(slug: string) {
    setToolSlugs((prev) => prev.filter((s) => s !== slug));
    setLayout((prev) => {
      const next = { ...prev };
      delete next[slug];
      return next;
    });
  }

  function moveTool(slug: string, position: ToolPosition) {
    setToolSlugs((prev) => [...prev.filter((s) => s !== slug), slug]);
    setLayout((prev) => ({ ...prev, [slug]: position }));
  }

  function resizeTool(slug: string, size: { width: number; height: number }) {
    setLayout((prev) => {
      const existing = prev[slug] ?? defaultToolPosition(toolSlugs.indexOf(slug));
      return { ...prev, [slug]: { ...existing, ...size } };
    });
  }

  // Тот же приём измерения плавающей панели, что и на настоящей странице
  // (см. app/[locale]/workbench/page.tsx) — карточки не должны рождаться
  // под ней.
  const panelRef = useRef<HTMLDivElement>(null);
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

  const [viewportHeight, setViewportHeight] = useState(0);
  useEffect(() => {
    function update() { setViewportHeight(window.innerHeight); }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const canvasMinHeight = Math.max(CANVAS_FALLBACK_HEIGHT, viewportHeight - HEADER_HEIGHT);

  return (
    <div className="relative w-full">
      <div
        ref={panelRef}
        className="fixed left-4 top-[60px] z-30 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-surface/95 p-4 shadow-lg backdrop-blur-md"
      >
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h1 className="text-base font-bold text-text-primary">
            {isRu ? "Рабочий стол — превью" : "Workbench — preview"}
          </h1>
          <span className="text-xs text-text-muted">{toolSlugs.length}/{GUEST_MAX_TOOLS}</span>
        </div>
        <p className="mb-3 text-xs text-text-muted">
          {isRu
            ? "Демо-режим: можно двигать и менять карточки, но изменения не сохраняются."
            : "Demo mode — drag and swap cards freely, but nothing here is saved."}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setPickerOpen(true)}
            disabled={toolSlugs.length >= GUEST_MAX_TOOLS}
            className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRu ? "Добавить инструмент" : "Add tool"}
          </button>
          <Link
            href={localePath(locale, "/auth/signup")}
            className="ml-auto rounded border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
          >
            {isRu ? "Сохранить — зарегистрироваться" : "Sign up to save"}
          </Link>
        </div>
      </div>

      <div className="relative w-full">
        <WorkbenchCanvas
          tools={activeTools}
          layout={layout}
          dict={dict}
          locale={locale}
          onRemove={removeTool}
          onMove={moveTool}
          onResize={resizeTool}
          minHeight={canvasMinHeight}
          bordered={false}
          avoidTopLeft={avoidTopLeft}
        />

        {activeTools.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
            <div className="pointer-events-auto max-w-sm rounded-lg border border-border bg-surface p-10 text-center shadow-lg">
              <div className="mb-3 flex justify-center text-text-muted"><GameIcon id="wrench" size={28} /></div>
              <p className="font-medium text-text-secondary">
                {isRu ? "Стол пуст" : "Nothing here yet"}
              </p>
              <p className="mt-2 text-sm text-text-muted">
                {isRu ? "Добавь инструмент, чтобы посмотреть, как это работает." : "Add a tool to see how it works."}
              </p>
              <button
                onClick={() => setPickerOpen(true)}
                className="mt-4 inline-block rounded bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-amber-400"
              >
                {isRu ? "Выбрать инструмент" : "Browse tools"}
              </button>
            </div>
          </div>
        )}
      </div>

      <ToolPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        locale={locale}
        addedSlugs={toolSlugs}
        maxTools={GUEST_MAX_TOOLS}
        isPro={false}
        onToggle={(slug) => {
          if (toolSlugs.includes(slug)) removeTool(slug);
          else addTool(slug);
        }}
      />
    </div>
  );
}
