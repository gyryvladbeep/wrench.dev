"use client";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value as object).sort().map((k) => [k, sortKeys((value as Record<string, unknown>)[k])])
    );
  }
  return value;
}

export function JsonSortTool({ dict }: { dict: Dictionary }) {
  const [input, setInput] = useState('{"zebra":1,"apple":{"mango":2,"banana":3},"cherry":[5,2,1]}');
  const [indent, setIndent] = useState<2 | 4>(2);

  const result = useMemo(() => {
    if (!input.trim()) return { ok: true as const, value: "" };
    try {
      const sorted = sortKeys(JSON.parse(input));
      return { ok: true as const, value: JSON.stringify(sorted, null, indent) };
    } catch (e) {
      return { ok: false as const, message: e instanceof Error ? e.message : "Invalid JSON" };
    }
  }, [input, indent]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-text-muted">Indent:</span>
        {([2, 4] as const).map((n) => (
          <button key={n} onClick={() => setIndent(n)}
            className={`rounded-[10px] px-2 py-1 text-sm ${indent === n ? "bg-accent text-accent-fg" : "bg-surface hover:bg-surface-hover"}`}>{n}</button>
        ))}
        <div className="ml-auto">
          <CopyButton value={result.ok ? result.value : ""} label={dict.common.copy} copiedLabel={dict.common.copied} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">{dict.common.input}</label>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false}
            className="code-surface h-72 w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">{dict.common.output}</label>
          <textarea readOnly value={result.ok ? result.value : `Error: ${result.message}`} spellCheck={false}
            className={`code-surface h-72 w-full rounded-[10px] p-3 font-mono text-sm outline-none ${result.ok ? "text-text-primary" : "text-red-400"}`} />
        </div>
      </div>
    </div>
  );
}
