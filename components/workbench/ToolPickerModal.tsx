"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Locale, localePath } from "@/lib/i18n/config";
import { localizeTool } from "@/lib/i18n/localize";
import { getImplementedTools, searchTools } from "@/lib/tools-registry";
import { CategoryIcon } from "@/components/CategoryIcon";
import { WORKBENCH_UI, formatWorkbenchString } from "@/lib/i18n/workbench-content";
import { CheckIcon, CloseIcon } from "@/components/icons/GameIcons";

interface ToolPickerModalProps {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  addedSlugs: string[];
  maxTools: number;
  isPro: boolean;
  onToggle: (slug: string) => void;
}

export function ToolPickerModal({
  open, onClose, locale, addedSlugs, maxTools, isPro, onToggle,
}: ToolPickerModalProps) {
  const [query, setQuery] = useState("");
  const t = WORKBENCH_UI[locale];
  const atLimit = addedSlugs.length >= maxTools;

  const tools = useMemo(() => {
    const base = query.trim() ? searchTools(query, locale) : getImplementedTools();
    return base.filter((tool) => tool.isImplemented).map((tool) => localizeTool(tool, locale));
  }, [query, locale]);

  // Модалка показывает подсказку "Esc" у поля поиска, но до этого места
  // ничего Escape не обрабатывало — закрывался пикер только кликом по
  // фону. Тот же приём, что и в SearchModal.tsx: слушаем keydown на
  // window, пока модалка открыта.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 pt-[10vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-scale-in flex w-full max-w-xl flex-col overflow-hidden rounded-[12px] border border-border bg-canvas shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-text-muted" aria-hidden>
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-text-muted hover:text-text-primary text-xs"><CloseIcon size={11} /></button>
          )}
          <kbd className="rounded border border-border px-1.5 py-0.5 text-xs text-text-muted">Esc</kbd>
        </div>

        {/* Limit banner */}
        {atLimit && (
          <div className="border-b border-border bg-amber-500/10 px-4 py-2.5 text-xs text-amber-400">
            {formatWorkbenchString(t.limitToolsReached, { max: maxTools })}
            {!isPro && (
              <Link href={localePath(locale, "/pro")} className="ml-1.5 font-medium underline hover:no-underline">
                {t.upgradeHint}
              </Link>
            )}
          </div>
        )}

        {/* Tool list */}
        <div className="max-h-[24rem] overflow-y-auto p-2">
          {tools.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-text-muted">{t.noResults}</p>
          )}
          {tools.map((tool) => {
            const added = addedSlugs.includes(tool.slug);
            const disabled = !added && atLimit;
            return (
              <button
                key={tool.slug}
                disabled={disabled}
                onClick={() => onToggle(tool.slug)}
                className={`flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 text-left text-sm transition-colors ${
                  disabled ? "cursor-not-allowed opacity-40" : "hover:bg-surface"
                } ${added ? "bg-accent/10" : ""}`}
              >
                <span className="w-5 shrink-0 text-text-muted opacity-60">
                  <CategoryIcon category={tool.category} size={13} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-text-primary">{tool.name}</p>
                  <p className="truncate text-xs text-text-muted">{tool.shortDescription}</p>
                </div>
                <span className={`shrink-0 text-base leading-none ${added ? "text-accent" : "text-text-disabled"}`}>
                  {added ? <CheckIcon size={13} /> : "+"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
