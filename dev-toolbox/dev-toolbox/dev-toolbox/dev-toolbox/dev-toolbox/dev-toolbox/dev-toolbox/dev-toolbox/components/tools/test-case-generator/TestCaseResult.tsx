"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { OutputFormat } from "./TestCaseForm";

interface Props {
  content:  string;
  format:   OutputFormat;
  isRu:     boolean;
  onEdit:   (v: string) => void;
}

export function TestCaseResult({ content, format, isRu, onEdit }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(content);
  const { success } = useToast();

  function copyAll() {
    navigator.clipboard.writeText(content).then(() => success(isRu ? "Скопировано" : "Copied"));
  }

  function download() {
    const ext  = format === "JSON" ? "json" : format === "Gherkin" ? "feature" : "md";
    const mime = format === "JSON" ? "application/json" : "text/plain";
    const blob = new Blob([content], { type: mime });
    const a    = document.createElement("a");
    a.href     = URL.createObjectURL(blob);
    a.download = `test-cases.${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
    success(isRu ? "Файл скачан" : "Downloaded");
  }

  function saveEdit() {
    onEdit(draft);
    setEditing(false);
    success(isRu ? "Сохранено" : "Saved");
  }

  const ext = format === "JSON" ? ".json" : format === "Gherkin" ? ".feature" : ".md";

  return (
    <div className="mt-8">
      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-text-primary">
          {isRu ? "Результат" : "Result"}
          <span className="ml-2 rounded border border-border px-1.5 py-px text-[10px] font-normal text-text-muted">{format}</span>
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={copyAll}
            className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
              <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M11 5V4a1 1 0 00-1-1H4a1 1 0 00-1 1v6a1 1 0 001 1h1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            {isRu ? "Копировать всё" : "Copy all"}
          </button>
          <button onClick={download}
            className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M8 2v8M5 7l3 3 3-3M3 13h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {isRu ? `Скачать ${ext}` : `Download ${ext}`}
          </button>
          <button onClick={() => { setDraft(content); setEditing(!editing); }}
            className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors ${
              editing ? "border-accent/40 bg-accent/10 text-accent" : "border-border bg-surface text-text-muted hover:bg-surface-hover hover:text-text-primary"
            }`}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M11 2l3 3-8 8H3v-3l8-8z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {isRu ? "Редактировать" : "Edit"}
          </button>
        </div>
      </div>

      {/* Content */}
      {editing ? (
        <div className="space-y-2">
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} spellCheck={false}
            className="code-surface h-[32rem] w-full rounded-[10px] p-4 font-mono text-sm text-text-primary outline-none resize-y" />
          <div className="flex gap-2">
            <button onClick={saveEdit}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:bg-accent/90 transition-colors">
              {isRu ? "Сохранить" : "Save"}
            </button>
            <button onClick={() => setEditing(false)}
              className="rounded-md border border-border bg-surface px-4 py-2 text-sm text-text-muted hover:bg-surface-hover transition-colors">
              {isRu ? "Отмена" : "Cancel"}
            </button>
          </div>
        </div>
      ) : (
        <pre className="code-surface max-h-[48rem] overflow-auto rounded-[10px] p-4 font-mono text-sm text-text-primary whitespace-pre-wrap">
          {content}
        </pre>
      )}
    </div>
  );
}
