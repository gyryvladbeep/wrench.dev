"use client";
import { useState } from "react";
import { Tool } from "@/lib/types";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { Locale } from "@/lib/i18n/config";
import { CategoryIcon } from "@/components/CategoryIcon";
import { ToolRenderer } from "@/components/tools/ToolRenderer";
import { WORKBENCH_UI } from "@/lib/i18n/workbench-content";
import { CloseIcon } from "@/components/icons/GameIcons";

interface WorkbenchGridProps {
  tools: Tool[]; // локализованы и уже в порядке отображения
  dict: Dictionary;
  locale: Locale;
  onRemove: (slug: string) => void;
  onReorder: (newSlugOrder: string[]) => void;
}

export function WorkbenchGrid({ tools, dict, locale, onRemove, onReorder }: WorkbenchGridProps) {
  const t = WORKBENCH_UI[locale];
  const [draggedSlug, setDraggedSlug] = useState<string | null>(null);
  const [overSlug, setOverSlug] = useState<string | null>(null);

  // ═══════════════════════════════════════════════════════
  // Обычный HTML5 drag & drop, без сторонних библиотек
  // ═══════════════════════════════════════════════════════
  // На одной странице обычно не больше десятка карточек — для такого
  // масштаба полноценная библиотека вроде dnd-kit была бы лишней
  // зависимостью. Три нативных обработчика (dragstart/dragover/drop)
  // на карточку полностью решают задачу "перетащить, чтобы поменять
  // порядок", без единого нового пакета в package.json.
  function handleDrop(targetSlug: string) {
    if (!draggedSlug || draggedSlug === targetSlug) { setDraggedSlug(null); setOverSlug(null); return; }
    const current = tools.map((tool) => tool.slug);
    const from = current.indexOf(draggedSlug);
    const to   = current.indexOf(targetSlug);
    if (from === -1 || to === -1) { setDraggedSlug(null); setOverSlug(null); return; }
    const next = [...current];
    next.splice(from, 1);
    next.splice(to, 0, draggedSlug);
    onReorder(next);
    setDraggedSlug(null);
    setOverSlug(null);
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {tools.map((tool) => (
        <div
          key={tool.slug}
          draggable
          onDragStart={() => setDraggedSlug(tool.slug)}
          onDragOver={(e) => { e.preventDefault(); if (overSlug !== tool.slug) setOverSlug(tool.slug); }}
          onDragLeave={() => setOverSlug((s) => (s === tool.slug ? null : s))}
          onDrop={(e) => { e.preventDefault(); handleDrop(tool.slug); }}
          onDragEnd={() => { setDraggedSlug(null); setOverSlug(null); }}
          className={`flex flex-col rounded-xl border bg-surface transition-all ${
            draggedSlug === tool.slug ? "opacity-40" : ""
          } ${overSlug === tool.slug && draggedSlug && draggedSlug !== tool.slug ? "border-accent" : "border-border"}`}
        >
          <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
            <span title={t.dragHandleTitle} className="cursor-grab select-none text-text-disabled">⋮⋮</span>
            <span className="shrink-0 text-text-muted opacity-70"><CategoryIcon category={tool.category} size={13} /></span>
            <h3 className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">{tool.name}</h3>
            <button
              onClick={() => onRemove(tool.slug)}
              aria-label={t.removeToolAria}
              title={t.removeToolAria}
              className="shrink-0 rounded p-1 text-text-muted transition-colors hover:bg-surface-hover hover:text-red-400"
            >
              <CloseIcon size={11} />
            </button>
          </div>
          <div className="p-4">
            <ToolRenderer slug={tool.slug} tool={tool} dict={dict} locale={locale} />
          </div>
        </div>
      ))}
    </div>
  );
}
