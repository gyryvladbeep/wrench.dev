"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

const SAMPLE = `{"name":"Ada Lovelace","born":1815,"skills":["math","programming"],"active":true}`;

export function JsonFormatterTool({ dict }: { dict: Dictionary }) {
  const [input, setInput] = useState(SAMPLE);
  const [indent, setIndent] = useState<2 | 4 | "tab">(2);
  const [mode, setMode] = useState<"format" | "minify">("format");

  const result = useMemo(() => {
    if (!input.trim()) return { ok: true as const, value: "" };
    try {
      const parsed = JSON.parse(input);
      const value =
        mode === "minify"
          ? JSON.stringify(parsed)
          : JSON.stringify(parsed, null, indent === "tab" ? "\t" : indent);
      return { ok: true as const, value };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid JSON";
      return { ok: false as const, message };
    }
  }, [input, mode, indent]);

  function handleDownload() {
    if (!result.ok || !result.value) return;
    const blob = new Blob([result.value], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "formatted.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  const t = dict.tools.jsonFormatter;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant={mode === "format" ? "primary" : "secondary"} onClick={() => setMode("format")}>
          {t.format}
        </Button>
        <Button variant={mode === "minify" ? "primary" : "secondary"} onClick={() => setMode("minify")}>
          {t.minify}
        </Button>
        <div className="ml-2 flex items-center gap-1 text-sm text-text-muted">
          <span>{t.indent}</span>
          {([2, 4, "tab"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setIndent(opt)}
              className={`rounded-[10px] px-2 py-1 ${
                indent === opt ? "bg-accent text-accent-fg" : "bg-surface hover:bg-surface-hover"
              }`}
            >
              {opt === "tab" ? t.tab : opt}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <CopyButton value={result.ok ? result.value : ""} label={dict.common.copy} copiedLabel={dict.common.copied} />
          <Button variant="secondary" onClick={handleDownload} disabled={!result.ok || !result.value}>
            {dict.common.download}
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="json-input" className="mb-1 block text-xs font-medium text-text-muted">
            {dict.common.input}
          </label>
          <textarea
            id="json-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            className="code-surface h-72 w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none"
            placeholder={t.placeholder}
          />
        </div>
        <div>
          <label htmlFor="json-output" className="mb-1 block text-xs font-medium text-text-muted">
            {dict.common.output}
          </label>
          <textarea
            id="json-output"
            readOnly
            value={result.ok ? result.value : `${t.invalidPrefix} ${result.message}`}
            spellCheck={false}
            className={`code-surface h-72 w-full rounded-[10px] p-3 font-mono text-sm outline-none ${
              result.ok ? "text-text-primary" : "text-red-400"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
