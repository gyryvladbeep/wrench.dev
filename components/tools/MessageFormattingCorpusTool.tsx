"use client";
import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { CopyButton } from "@/components/CopyButton";
import { CORPUS, CORPUS_CATEGORIES, CorpusCategory, casesIn } from "@/lib/messenger/corpus";
import { btnActiveClass, btnClass, inputClass } from "./messenger/ui";

export function MessageFormattingCorpusTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [cat, setCat] = useState<CorpusCategory>("markdown");
  const [q, setQ] = useState("");
  const cases = useMemo(() => {
    const list = casesIn(cat);
    const s = q.trim().toLowerCase();
    return s ? list.filter((c) => (c.title.en + c.title.ru + c.text).toLowerCase().includes(s)) : list;
  }, [cat, q]);
  const all = cases.map((c) => c.text).join("\n\n");

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex flex-wrap items-center gap-2" role="tablist">
        {CORPUS_CATEGORIES.map((c) => (
          <button key={c.id} type="button" role="tab" aria-selected={cat === c.id} data-testid={`corpus-tab-${c.id}`} onClick={() => setCat(c.id)} className={cat === c.id ? btnActiveClass : btnClass}>
            {isRu ? c.ru : c.en} ({casesIn(c.id).length})
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="corpus-search" className="input-label">{isRu ? "Поиск по набору" : "Search cases"}</label>
          <input id="corpus-search" value={q} onChange={(e) => setQ(e.target.value)} className={inputClass} />
        </div>
        <CopyButton value={all} label={isRu ? "Копировать все" : "Copy all"} />
      </div>
      <p className="text-xs text-text-muted" data-testid="corpus-count">{cases.length} / {CORPUS.length}</p>
      <ul className="space-y-3" data-testid="corpus-list">
        {cases.map((c) => (
          <li key={c.id} data-testid={`corpus-case-${c.id}`} className="rounded-lg border border-border bg-surface p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium text-text-primary">{isRu ? c.title.ru : c.title.en}</h3>
              <CopyButton value={c.text} iconOnly />
            </div>
            <pre className="code-surface overflow-x-auto whitespace-pre-wrap break-all rounded-lg px-3 py-2 font-mono text-xs text-text-primary">{c.text}</pre>
            <p className="mt-2 text-xs text-text-muted">{isRu ? c.check.ru : c.check.en}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
