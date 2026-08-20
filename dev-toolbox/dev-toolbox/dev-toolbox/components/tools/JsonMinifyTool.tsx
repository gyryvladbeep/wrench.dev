"use client";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

const SAMPLE = `{
  "name": "Ada Lovelace",
  "born": 1815,
  "skills": [
    "mathematics",
    "programming"
  ]
}`;

export function JsonMinifyTool({ dict }: { dict: Dictionary }) {
  const [input, setInput] = useState(SAMPLE);

  const result = useMemo(() => {
    if (!input.trim()) return { ok: true as const, value: "", saved: 0 };
    try {
      const minified = JSON.stringify(JSON.parse(input));
      const saved = Math.round((1 - minified.length / input.length) * 100);
      return { ok: true as const, value: minified, saved };
    } catch (e) {
      return { ok: false as const, message: e instanceof Error ? e.message : "Invalid JSON", saved: 0 };
    }
  }, [input]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="ml-auto flex items-center gap-3">
          {result.ok && result.value && (
            <span className="text-xs text-text-muted">{result.saved}% smaller</span>
          )}
          <CopyButton value={result.ok ? result.value : ""} label={dict.common.copy} copiedLabel={dict.common.copied} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">{dict.common.input}</label>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false}
            className="code-surface h-72 w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none" placeholder="Paste JSON here…" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">Minified</label>
          <textarea readOnly value={result.ok ? result.value : `Error: ${result.message}`} spellCheck={false}
            className={`code-surface h-72 w-full rounded-[10px] p-3 font-mono text-sm outline-none ${result.ok ? "text-text-primary" : "text-red-400"}`} />
        </div>
      </div>
    </div>
  );
}
