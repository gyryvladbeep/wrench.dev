"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { searchTools } from "@/lib/tools-registry";
import { Tool } from "@/lib/types";
import { Locale, localePath } from "@/lib/i18n/config";
import { localizeTool } from "@/lib/i18n/localize";

const CATEGORY_ICONS: Record<string, string> = {
  formatting: "{ }",
  encoding:   "⇄",
  text:       "Aa",
  hash:       "#",
  generators: "⚡",
  datetime:   "⏱",
  web:        "🌐",
  data:       "⊞",
  qa:         "✓",
  api:        "→",
};

const UI: Record<Locale, {
  placeholder: string;
  noResults: string;
  hint: string;
  comingSoon: string;
  navigate: string;
  open: string;
  close: string;
}> = {
  en: {
    placeholder: "Search tools…",
    noResults:   "No results found",
    hint:        "Type a tool name or description",
    comingSoon:  "coming soon",
    navigate:    "↑↓ navigate",
    open:        "↵ open",
    close:       "Esc close",
  },
  ru: {
    placeholder: "Поиск инструментов…",
    noResults:   "Ничего не найдено",
    hint:        "Введите название или описание инструмента",
    comingSoon:  "скоро",
    navigate:    "↑↓ навигация",
    open:        "↵ открыть",
    close:       "Esc закрыть",
  },
};

interface SearchModalProps {
  locale: Locale;
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ locale, open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Tool[]>([]);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = UI[locale];

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    // Search raw then localize for display
    const raw = searchTools(query).slice(0, 8);
    setResults(raw);
    setSelected(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape")    onClose();
      if (e.key === "ArrowDown") setSelected((s) => Math.min(s + 1, results.length - 1));
      if (e.key === "ArrowUp")   setSelected((s) => Math.max(s - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results.length, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[15vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-[10px] border border-border bg-canvas shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <span className="text-text-muted">⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.placeholder}
            className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 text-xs text-text-muted">Esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {query && results.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-text-muted">{t.noResults}</p>
          )}
          {results.map((rawTool, i) => {
            const tool = localizeTool(rawTool, locale);
            return (
              <Link
                key={tool.slug}
                href={localePath(locale, `/tools/${tool.slug}`)}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  i === selected ? "bg-surface-hover" : "hover:bg-surface"
                }`}
              >
                <span className="w-8 text-center font-mono text-xs text-text-muted">
                  {CATEGORY_ICONS[tool.category] ?? "→"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary truncate">{tool.name}</p>
                  <p className="text-xs text-text-muted truncate">{tool.shortDescription}</p>
                </div>
                {!tool.isImplemented && (
                  <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-xs text-text-muted">
                    {t.comingSoon}
                  </span>
                )}
              </Link>
            );
          })}
          {!query && (
            <p className="px-4 py-6 text-center text-sm text-text-muted">{t.hint}</p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-2 text-xs text-text-muted flex gap-4">
          <span>{t.navigate}</span>
          <span>{t.open}</span>
          <span>{t.close}</span>
        </div>
      </div>
    </div>
  );
}
