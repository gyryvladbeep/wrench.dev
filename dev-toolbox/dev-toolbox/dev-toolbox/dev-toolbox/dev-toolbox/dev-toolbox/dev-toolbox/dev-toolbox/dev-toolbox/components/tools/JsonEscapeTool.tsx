"use client";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

export function JsonEscapeTool({ dict }: { dict: Dictionary }) {
  const [mode, setMode] = useState<"escape" | "unescape">("escape");
  const [input, setInput] = useState(`{"name":"Ada Lovelace","quote":"She said \\"hello\\"!"}`);

  const result = useMemo(() => {
    if (!input) return { ok: true as const, value: "" };
    try {
      if (mode === "escape") {
        // Escape a JSON string for embedding inside another JSON string
        return { ok: true as const, value: JSON.stringify(input) };
      } else {
        // Unescape: parse a JSON-encoded string back to raw content
        const parsed = JSON.parse(input);
        return { ok: true as const, value: typeof parsed === "string" ? parsed : JSON.stringify(parsed, null, 2) };
      }
    } catch (e) {
      return { ok: false as const, message: e instanceof Error ? e.message : "Error" };
    }
  }, [input, mode]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Button variant={mode === "escape" ? "primary" : "secondary"} onClick={() => setMode("escape")}>Escape</Button>
        <Button variant={mode === "unescape" ? "primary" : "secondary"} onClick={() => setMode("unescape")}>Unescape</Button>
        <div className="ml-auto">
          <CopyButton value={result.ok ? result.value : ""} label={dict.common.copy} copiedLabel={dict.common.copied} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">{dict.common.input}</label>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false}
            className="code-surface h-64 w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">{dict.common.output}</label>
          <textarea readOnly value={result.ok ? result.value : `Error: ${result.message}`} spellCheck={false}
            className={`code-surface h-64 w-full rounded-[10px] p-3 font-mono text-sm outline-none ${result.ok ? "text-text-primary" : "text-red-400"}`} />
        </div>
      </div>
    </div>
  );
}
