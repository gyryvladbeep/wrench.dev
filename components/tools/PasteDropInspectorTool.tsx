"use client";
import { useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { btnClass } from "./messenger/ui";

interface Snapshot {
  source: "paste" | "drop";
  types: string[];
  items: { kind: string; type: string }[];
  files: { name: string; type: string; size: number }[];
  text: string;
  html: string;
}

function snap(source: Snapshot["source"], dt: DataTransfer | null): Snapshot {
  const items = dt ? Array.from(dt.items ?? []).map((i) => ({ kind: i.kind, type: i.type })) : [];
  const files = dt ? Array.from(dt.files ?? []).map((f) => ({ name: f.name, type: f.type || "(empty)", size: f.size })) : [];
  return { source, types: dt ? Array.from(dt.types ?? []) : [], items, files, text: dt?.getData("text/plain") ?? "", html: dt?.getData("text/html") ?? "" };
}

export function PasteDropInspectorTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [s, setS] = useState<Snapshot | null>(null);
  const [over, setOver] = useState(false);

  return (
    <div className="space-y-5 max-w-4xl">
      <div
        tabIndex={0}
        role="textbox"
        aria-label={isRu ? "Зона вставки и перетаскивания" : "Paste and drop zone"}
        data-testid="pd-zone"
        onPaste={(e) => { e.preventDefault(); setS(snap("paste", e.clipboardData)); }}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); setS(snap("drop", e.dataTransfer)); }}
        className={`flex min-h-[160px] items-center justify-center rounded-lg border-2 border-dashed p-6 text-center text-sm outline-none focus:border-accent ${over ? "border-accent bg-accent/5" : "border-border text-text-muted"}`}
      >
        {isRu ? "Кликните сюда и нажмите Ctrl+V (или Cmd+V), либо перетащите файл или текст в эту область." : "Click here and press Ctrl+V (or Cmd+V), or drag a file or text into this area."}
      </div>
      {s ? (
        <div className="space-y-4" data-testid="pd-result" data-source={s.source}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-text-primary">{s.source === "paste" ? (isRu ? "Вставка" : "Paste") : (isRu ? "Перетаскивание" : "Drop")}</h3>
            <button type="button" className={btnClass} onClick={() => setS(null)}>{isRu ? "Очистить" : "Clear"}</button>
          </div>
          <p className="text-sm text-text-muted" data-testid="pd-types">types: <span className="font-mono">{s.types.join(", ") || "-"}</span></p>
          <section>
            <h4 className="input-label">{isRu ? "Элементы" : "Items"} ({s.items.length})</h4>
            <ul className="text-sm font-mono" data-testid="pd-items">{s.items.map((i, k) => <li key={k}>{i.kind} / {i.type || "(empty)"}</li>)}</ul>
          </section>
          <section>
            <h4 className="input-label">{isRu ? "Файлы" : "Files"} ({s.files.length})</h4>
            <ul className="text-sm font-mono" data-testid="pd-files">{s.files.map((f, k) => <li key={k} data-name={f.name}>{f.name} - {f.type} - {f.size} B</li>)}</ul>
          </section>
          <section>
            <h4 className="input-label">text/plain</h4>
            <pre className="code-surface overflow-x-auto whitespace-pre-wrap break-all rounded-lg px-3 py-2 font-mono text-xs" data-testid="pd-text">{s.text || "-"}</pre>
          </section>
          <section>
            <h4 className="input-label">text/html</h4>
            <pre className="code-surface overflow-x-auto whitespace-pre-wrap break-all rounded-lg px-3 py-2 font-mono text-xs" data-testid="pd-html">{s.html || "-"}</pre>
          </section>
        </div>
      ) : (
        <p className="text-sm text-text-muted" data-testid="pd-empty">{isRu ? "Пока ничего не вставлено." : "Nothing pasted yet."}</p>
      )}
    </div>
  );
}
