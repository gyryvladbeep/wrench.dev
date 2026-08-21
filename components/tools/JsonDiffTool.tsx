"use client";
import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";

type DiffResult = { key: string; type: "added"|"removed"|"changed"|"unchanged"; left?: unknown; right?: unknown; }[];

function flattenObject(obj: unknown, prefix = ""): Record<string, unknown> {
  if (typeof obj !== "object" || obj === null) return { [prefix || "value"]: obj };
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      Object.assign(result, flattenObject(v, fullKey));
    } else {
      result[fullKey] = v;
    }
  }
  return result;
}

function diffJson(left: string, right: string): { ok: boolean; diffs: DiffResult; error?: string } {
  try {
    const l = flattenObject(JSON.parse(left));
    const r = flattenObject(JSON.parse(right));
    const allKeys = new Set([...Object.keys(l), ...Object.keys(r)]);
    const diffs: DiffResult = [];
    for (const key of allKeys) {
      const lv = l[key], rv = r[key];
      if (!(key in l)) diffs.push({ key, type:"added",   right:rv });
      else if (!(key in r)) diffs.push({ key, type:"removed", left:lv });
      else if (JSON.stringify(lv) !== JSON.stringify(rv)) diffs.push({ key, type:"changed", left:lv, right:rv });
      else diffs.push({ key, type:"unchanged", left:lv, right:rv });
    }
    return { ok:true, diffs };
  } catch (e) {
    return { ok:false, diffs:[], error: e instanceof Error ? e.message : "Parse error" };
  }
}

const TYPE_STYLES: Record<string, string> = {
  added:     "bg-green-900/20 border-green-800/30",
  removed:   "bg-red-900/20 border-red-800/30",
  changed:   "bg-amber-900/20 border-amber-800/30",
  unchanged: "bg-surface border-border opacity-50",
};

const LEFT  = `{
  "name": "Alice",
  "age": 28,
  "role": "QA Engineer",
  "active": true,
  "score": 95
}`;

const RIGHT = `{
  "name": "Alice",
  "age": 29,
  "role": "Senior QA",
  "active": true,
  "department": "Engineering"
}`;

export function JsonDiffTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.common.copy === "Копировать";
  const [left,  setLeft]  = useState(LEFT);
  const [right, setRight] = useState(RIGHT);
  const [showUnchanged, setShowUnchanged] = useState(false);

  const result = useMemo(() => diffJson(left, right), [left, right]);

  const stats = useMemo(() => {
    const s = { added:0, removed:0, changed:0, unchanged:0 };
    result.diffs.forEach(d => s[d.type]++);
    return s;
  }, [result.diffs]);

  const filtered = result.diffs.filter(d => showUnchanged || d.type !== "unchanged");

  return (
    <div className="space-y-4">
      {/* Inputs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="input-label">{isRu ? "JSON слева (оригинал)" : "Left JSON (original)"}</label>
          <textarea value={left} onChange={e => setLeft(e.target.value)} rows={10} spellCheck={false}
            className="code-surface w-full rounded-lg p-3 font-mono text-sm text-text-primary outline-none" />
        </div>
        <div>
          <label className="input-label">{isRu ? "JSON справа (изменённый)" : "Right JSON (modified)"}</label>
          <textarea value={right} onChange={e => setRight(e.target.value)} rows={10} spellCheck={false}
            className="code-surface w-full rounded-lg p-3 font-mono text-sm text-text-primary outline-none" />
        </div>
      </div>

      {!result.ok && (
        <div className="rounded-lg border border-red-800/30 bg-red-900/10 px-4 py-3 text-sm text-red-400">{result.error}</div>
      )}

      {result.ok && (
        <div className="space-y-3">
          {/* Stats */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-3">
              {stats.added   > 0 && <span className="text-xs text-success">+{stats.added} {isRu ? "добавлено" : "added"}</span>}
              {stats.removed > 0 && <span className="text-xs text-error">−{stats.removed} {isRu ? "удалено" : "removed"}</span>}
              {stats.changed > 0 && <span className="text-xs text-amber-400">~{stats.changed} {isRu ? "изменено" : "changed"}</span>}
              {stats.unchanged > 0 && <span className="text-xs text-text-muted">={stats.unchanged} {isRu ? "без изменений" : "unchanged"}</span>}
            </div>
            <label className="ml-auto flex items-center gap-2 text-xs text-text-muted cursor-pointer">
              <input type="checkbox" checked={showUnchanged} onChange={e => setShowUnchanged(e.target.checked)} className="accent-accent" />
              {isRu ? "Показать без изменений" : "Show unchanged"}
            </label>
          </div>

          {/* Diff */}
          <div className="space-y-1">
            {filtered.map((d, i) => (
              <div key={i} className={`flex gap-3 rounded-lg border px-4 py-2 ${TYPE_STYLES[d.type]}`}>
                <span className="font-mono text-xs text-text-muted w-4">
                  {d.type==="added" ? "+" : d.type==="removed" ? "−" : d.type==="changed" ? "~" : "="}
                </span>
                <span className="font-mono text-xs text-text-secondary w-48 shrink-0 truncate">{d.key}</span>
                <div className="flex-1 min-w-0">
                  {d.type === "changed" && (
                    <div className="space-y-0.5">
                      <p className="font-mono text-xs text-red-400 line-through truncate">{JSON.stringify(d.left)}</p>
                      <p className="font-mono text-xs text-success truncate">{JSON.stringify(d.right)}</p>
                    </div>
                  )}
                  {d.type === "added"     && <p className="font-mono text-xs text-success truncate">{JSON.stringify(d.right)}</p>}
                  {d.type === "removed"   && <p className="font-mono text-xs text-red-400 truncate">{JSON.stringify(d.left)}</p>}
                  {d.type === "unchanged" && <p className="font-mono text-xs text-text-disabled truncate">{JSON.stringify(d.left)}</p>}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-center py-4 text-sm text-success">{isRu ? "✓ JSON идентичны" : "✓ JSONs are identical"}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}