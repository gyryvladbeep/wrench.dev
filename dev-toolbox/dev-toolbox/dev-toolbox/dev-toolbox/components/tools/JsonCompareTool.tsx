"use client";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dictionary } from "@/lib/i18n/dictionary-types";

type DiffEntry = { key: string; left: string; right: string; status: "added" | "removed" | "changed" | "same" };

function flattenJson(obj: unknown, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  if (obj === null || typeof obj !== "object") {
    result[prefix || "(root)"] = JSON.stringify(obj);
    return result;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => Object.assign(result, flattenJson(v, prefix ? `${prefix}[${i}]` : `[${i}]`)));
  } else {
    Object.entries(obj as Record<string, unknown>).forEach(([k, v]) => {
      const path = prefix ? `${prefix}.${k}` : k;
      if (v !== null && typeof v === "object") {
        Object.assign(result, flattenJson(v, path));
      } else {
        result[path] = JSON.stringify(v);
      }
    });
  }
  return result;
}

function diffJson(left: string, right: string): DiffEntry[] | null {
  try {
    const l = flattenJson(JSON.parse(left));
    const r = flattenJson(JSON.parse(right));
    const allKeys = Array.from(new Set([...Object.keys(l), ...Object.keys(r)])).sort();
    return allKeys.map((key) => ({
      key,
      left: l[key] ?? "",
      right: r[key] ?? "",
      status: !(key in l) ? "added" : !(key in r) ? "removed" : l[key] !== r[key] ? "changed" : "same",
    }));
  } catch { return null; }
}

const STATUS_STYLE: Record<string, string> = {
  added: "bg-green-500/10 text-green-400",
  removed: "bg-red-500/10 text-red-400",
  changed: "bg-yellow-500/10 text-yellow-400",
  same: "text-text-muted",
};

export function JsonCompareTool({ dict }: { dict: Dictionary }) {
  const [left, setLeft] = useState('{"name":"Ada","age":30,"role":"engineer"}');
  const [right, setRight] = useState('{"name":"Ada","age":31,"city":"London","role":"engineer"}');

  const diff = useMemo(() => diffJson(left, right), [left, right]);
  const changes = diff?.filter((d) => d.status !== "same").length ?? 0;

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">JSON A</label>
          <textarea value={left} onChange={(e) => setLeft(e.target.value)} spellCheck={false}
            className="code-surface h-48 w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">JSON B</label>
          <textarea value={right} onChange={(e) => setRight(e.target.value)} spellCheck={false}
            className="code-surface h-48 w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none" />
        </div>
      </div>

      {diff === null && (
        <p className="text-sm text-red-400">Invalid JSON in one or both inputs.</p>
      )}

      {diff !== null && (
        <div>
          <p className="mb-3 text-sm text-text-muted">
            {changes === 0 ? "✓ Identical" : `${changes} difference${changes === 1 ? "" : "s"} found`}
          </p>
          <div className="rounded-[10px] border border-border overflow-hidden">
            {diff.filter((d) => d.status !== "same" || true).map((d, i) => (
              <div key={i} className={`grid grid-cols-3 gap-2 border-b border-border px-3 py-2 text-xs font-mono last:border-0 ${STATUS_STYLE[d.status]}`}>
                <span className="truncate text-text-primary">{d.key}</span>
                <span className="truncate">{d.left || <em className="not-italic text-text-muted">—</em>}</span>
                <span className="truncate">{d.right || <em className="not-italic text-text-muted">—</em>}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-4 text-xs text-text-muted">
            <span className="text-green-400">■ added</span>
            <span className="text-red-400">■ removed</span>
            <span className="text-yellow-400">■ changed</span>
          </div>
        </div>
      )}
    </div>
  );
}
