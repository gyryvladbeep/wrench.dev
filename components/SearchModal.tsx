"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { searchTools, getPopularTools } from "@/lib/tools-registry";
import { Tool } from "@/lib/types";
import { Locale, localePath } from "@/lib/i18n/config";
import { localizeTool } from "@/lib/i18n/localize";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { EmptySearchResults } from "@/components/EmptyState";

const CATEGORY_ICONS: Record<string, string> = {
  formatting: "{ }", encoding: "⇄", text: "Aa", hash: "#",
  generators: "⚡", datetime: "⏱", web: "🌐", data: "⊞", qa: "✓", api: "→",
};

const MAX_RECENT = 5;

const UI: Record<Locale, {
  placeholder: string; noResults: string; hint: string;
  comingSoon: string; navigate: string; open: string; close: string;
  recentSearches: string; popularTools: string; clearRecent: string;
}> = {
  en: {
    placeholder: "Search tools…", noResults: "No results found",
    hint: "Type a tool name or description", comingSoon: "soon",
    navigate: "↑↓ navigate", open: "↵ open", close: "Esc close",
    recentSearches: "Recent", popularTools: "Popular tools", clearRecent: "Clear",
  },
  ru: {
    placeholder: "Поиск инструментов…", noResults: "Ничего не найдено",
    hint: "Введите название или описание инструмента", comingSoon: "скоро",
    navigate: "↑↓ навигация", open: "↵ открыть", close: "Esc закрыть",
    recentSearches: "Недавние", popularTools: "Популярные", clearRecent: "Очистить",
  },
};

/** Highlight matching substring in text */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase().trim());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-accent/25 text-accent rounded px-0.5">{text.slice(idx, idx + query.trim().length)}</mark>
      {text.slice(idx + query.trim().length)}
    </>
  );
}

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

  const [recentSearches, setRecentSearches] = useLocalStorage<string[]>("wrench_recent_searches", []);
  const popularTools = getPopularTools().slice(0, 5).map((t) => localizeTool(t, locale));

  useEffect(() => {
    if (open) {
      setQuery(""); setResults([]); setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const raw = searchTools(query, locale).slice(0, 8);
    setResults(raw);
    setSelected(0);
  }, [query, locale]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, results.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
      if (e.key === "Enter" && results[selected]) {
        const url = localePath(locale, `/tools/${results[selected].slug}`);
        window.location.href = url;
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, selected, locale, onClose]);

  function handleSelect(slug: string, term: string) {
    if (term) {
      setRecentSearches((prev) => [term, ...prev.filter((s) => s !== term)].slice(0, MAX_RECENT));
    }
    onClose();
  }

  function clearRecent() { setRecentSearches([]); }

  if (!open) return null;

  const showEmpty = !query.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-scale-in w-full max-w-xl overflow-hidden rounded-[12px] border border-border bg-canvas shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-text-muted">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.placeholder}
            className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-text-muted hover:text-text-primary text-xs">✕</button>
          )}
          <kbd className="rounded border border-border px-1.5 py-0.5 text-xs text-text-muted">Esc</kbd>
        </div>

        {/* Results / Empty state */}
        <div className="max-h-[26rem] overflow-y-auto">

          {/* Empty state — recent + popular */}
          {showEmpty && (
            <div className="p-2">
              {recentSearches.length > 0 && (
                <div className="mb-2">
                  <div className="flex items-center justify-between px-3 py-1.5">
                    <span className="text-xs font-medium text-text-muted">{t.recentSearches}</span>
                    <button onClick={clearRecent} className="text-xs text-text-muted hover:text-text-primary">{t.clearRecent}</button>
                  </div>
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="flex w-full items-center gap-2 rounded-[8px] px-3 py-2 text-sm text-text-muted hover:bg-surface hover:text-text-primary transition-colors text-left"
                    >
                      <span className="text-xs">⟳</span> {term}
                    </button>
                  ))}
                </div>
              )}
              <div className="px-3 py-1.5">
                <span className="text-xs font-medium text-text-muted">{t.popularTools}</span>
              </div>
              {popularTools.map((tool) => (
                <Link
                  key={tool.slug}
                  href={localePath(locale, `/tools/${tool.slug}`)}
                  onClick={() => handleSelect(tool.slug, "")}
                  className="flex items-center gap-3 rounded-[8px] px-3 py-2 text-sm hover:bg-surface transition-colors"
                >
                  <span className="w-6 text-center font-mono text-xs text-text-muted">{CATEGORY_ICONS[tool.category] ?? "→"}</span>
                  <span className="text-text-primary">{tool.name}</span>
                </Link>
              ))}
            </div>
          )}

          {/* No results */}
          {!showEmpty && results.length === 0 && (
            <EmptySearchResults query={query} />
          )}

          {/* Search results */}
          {results.map((rawTool, i) => {
            const tool = localizeTool(rawTool, locale);
            return (
              <Link
                key={tool.slug}
                href={localePath(locale, `/tools/${tool.slug}`)}
                onClick={() => handleSelect(tool.slug, query.trim())}
                className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  i === selected ? "bg-surface-hover" : "hover:bg-surface"
                }`}
              >
                <span className="w-7 text-center font-mono text-xs text-text-muted shrink-0">
                  {CATEGORY_ICONS[tool.category] ?? "→"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary truncate">
                    <Highlight text={tool.name} query={query} />
                  </p>
                  <p className="text-xs text-text-muted truncate">
                    <Highlight text={tool.shortDescription} query={query} />
                  </p>
                </div>
                {!tool.isImplemented && (
                  <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-xs text-text-muted">{t.comingSoon}</span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-4 py-2">
          <div className="flex gap-3 text-xs text-text-muted">
            <span>{t.navigate}</span>
            <span>{t.open}</span>
            <span>{t.close}</span>
          </div>
          <span className="text-xs text-text-muted font-mono">⌘K</span>
        </div>
      </div>
    </div>
  );
}
