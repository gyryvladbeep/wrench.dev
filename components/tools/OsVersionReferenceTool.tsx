"use client";
import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { filterVersions } from "@/lib/mobile/os-versions";

const inputClass = "code-surface w-full rounded-lg px-3 py-2.5 font-mono text-sm text-text-primary outline-none";

export function OsVersionReferenceTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [platform, setPlatform] = useState<"android" | "ios">("android");
  const [query, setQuery] = useState("");
  const rows = useMemo(() => filterVersions(platform, query), [platform, query]);

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex gap-1.5">
          {(["android", "ios"] as const).map((p) => (
            <button key={p} type="button" onClick={() => setPlatform(p)} aria-pressed={platform === p}
              className={`rounded-lg border px-3 py-2.5 text-sm transition-colors ${platform === p ? "border-accent/50 bg-accent/10 text-accent" : "border-border bg-surface text-text-muted hover:bg-surface-hover"}`}>
              {p === "android" ? "Android" : "iOS"}
            </button>
          ))}
        </div>
        <div className="min-w-[14rem] flex-1">
          <label htmlFor="ver-search" className="input-label">{isRu ? "Поиск по версиям" : "Search versions"}</label>
          <input id="ver-search" value={query} onChange={(e) => setQuery(e.target.value)} spellCheck={false}
            placeholder={isRu ? "например: api 34, уведомления, 2023" : "for example: api 34, notifications, 2023"} className={inputClass} />
        </div>
      </div>

      <div className="space-y-3" data-testid="ver-list">
        {rows.map((v) => (
          <article key={`${v.platform}-${v.version}`} data-testid={`ver-${v.platform}-${v.version}`} className="rounded-lg border border-border bg-surface p-4">
            <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 className="text-base font-semibold text-text-primary">{v.platform === "android" ? "Android" : "iOS"} {v.version}</h3>
              {v.api !== undefined && <span className="rounded border border-border bg-canvas px-2 py-0.5 font-mono text-xs text-text-primary">API {v.api}</span>}
              <span className="text-xs text-text-muted">{isRu ? "Выпуск" : "Released"}: {v.released}</span>
            </header>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-muted">
              {v.notes.map((note, i) => <li key={i}>{isRu ? note.ru : note.en}</li>)}
            </ul>
          </article>
        ))}
        {rows.length === 0 && <p className="text-sm text-text-muted" data-testid="ver-empty">{isRu ? "Ничего не найдено." : "No versions match your search."}</p>}
      </div>
      <p className="text-xs text-text-muted">
        {isRu
          ? "Справочник собран из официальных заметок о выпусках и показывает то, что чаще всего влияет на тестирование. Детали проверяйте в документации платформы."
          : "Compiled from official release notes and focused on what most often affects testing. Check the platform documentation for details."}
      </p>
    </div>
  );
}
