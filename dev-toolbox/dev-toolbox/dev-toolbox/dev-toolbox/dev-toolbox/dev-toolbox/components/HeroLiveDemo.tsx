"use client";
import { useMemo, useState } from "react";

const SAMPLE = `{"project":"Wrench-Branch","tools":44,"auth":false,"browser":true}`;

export function HeroLiveDemo({ dict }: { dict?: unknown }) {
  const [input, setInput]   = useState(SAMPLE);
  const [copied, setCopied] = useState(false);

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: "", error: false };
    try { return { output: JSON.stringify(JSON.parse(input), null, 2), error: false }; }
    catch  { return { output: "// Invalid JSON", error: true }; }
  }, [input]);

  async function handleCopy() {
    if (!output || error) return;
    await navigator.clipboard.writeText(output).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mx-auto mt-8 max-w-2xl overflow-hidden rounded-lg border border-border bg-[#0e0e13] text-left shadow-xl">
      {/* Title bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/50" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/50" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/50" />
        </div>
        <span className="text-[11px] text-text-muted font-mono">JSON Formatter — Wrench-Branch</span>
        <button onClick={handleCopy} disabled={!output || error}
          aria-label="Copy output"
          className={`rounded p-1 text-xs transition-colors disabled:opacity-30 ${copied ? "text-accent" : "text-text-muted hover:text-text-primary"}`}>
          {copied
            ? <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            : <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M11 5V4a1 1 0 00-1-1H4a1 1 0 00-1 1v6a1 1 0 001 1h1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          }
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2">
        <div className="border-b sm:border-b-0 sm:border-r border-border">
          <div className="border-b border-border px-3 py-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">Input</span>
          </div>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false}
            aria-label="JSON input"
            className="h-28 w-full resize-none bg-transparent p-3 font-mono text-xs text-text-primary outline-none" />
        </div>
        <div>
          <div className="border-b border-border px-3 py-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">Output</span>
          </div>
          <pre className={`h-28 overflow-auto p-3 font-mono text-xs ${error ? "text-red-400" : "text-text-primary"}`}>{output}</pre>
        </div>
      </div>
    </div>
  );
}
