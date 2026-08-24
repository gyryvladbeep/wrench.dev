"use client";
import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";

type DemoTool = "json" | "regex" | "base64" | "uuid";

const DEMOS: Record<DemoTool, {
  label: string;
  title: string;
  inputLabel: string;
  outputLabel: string;
  defaultInput: string;
  process: (input: string) => { output: string; error: boolean };
}> = {
  json: {
    label: "JSON Formatter",
    title: "JSON Formatter — Wrench-Branch",
    inputLabel: "INPUT",
    outputLabel: "OUTPUT",
    defaultInput: `{"project":"Wrench-Branch","tools":70,"auth":true,"browser":true}`,
    process: (input) => {
      try { return { output: JSON.stringify(JSON.parse(input), null, 2), error: false }; }
      catch { return { output: "// Invalid JSON", error: true }; }
    },
  },
  regex: {
    label: "Regex Tester",
    title: "Regex Tester — Wrench-Branch",
    inputLabel: "PATTERN",
    outputLabel: "MATCHES",
    defaultInput: `^[\\w.]+@[\\w]+\\.[a-z]{2,}$`,
    process: (input) => {
      try {
        const re = new RegExp(input);
        const tests = ["user@example.com", "hello@world.io", "notanemail", "@bad.com", "test+tag@mail.co"];
        const results = tests.map(t => `${re.test(t) ? "✓" : "✗"} ${t}`).join("\n");
        return { output: results, error: false };
      } catch { return { output: "// Invalid regex pattern", error: true }; }
    },
  },
  base64: {
    label: "Base64",
    title: "Base64 Encoder — Wrench-Branch",
    inputLabel: "TEXT",
    outputLabel: "BASE64",
    defaultInput: `Hello, Wrench-Branch! 🔧`,
    process: (input) => {
      try { return { output: btoa(unescape(encodeURIComponent(input))), error: false }; }
      catch { return { output: "// Encoding error", error: true }; }
    },
  },
  uuid: {
    label: "UUID Generator",
    title: "UUID Generator — Wrench-Branch",
    inputLabel: "COUNT",
    outputLabel: "UUIDs",
    defaultInput: `5`,
    process: (input) => {
      const count = Math.min(10, Math.max(1, parseInt(input) || 1));
      const uuids = Array.from({ length: count }, () =>
        "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
          const r = Math.random() * 16 | 0;
          return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
        })
      );
      return { output: uuids.join("\n"), error: false };
    },
  },
};

export function HeroLiveDemo({ dict }: { dict?: unknown }) {
  const { user } = useAuth();
  const [selected, setSelected] = useState<DemoTool>("json");
  const demo = DEMOS[selected];
  const [input,  setInput]  = useState(demo.defaultInput);
  const [copied, setCopied] = useState(false);

  const { output, error } = useMemo(() => demo.process(input), [input, demo]);

  function switchDemo(tool: DemoTool) {
    setSelected(tool);
    setInput(DEMOS[tool].defaultInput);
    setCopied(false);
  }

  async function handleCopy() {
    if (!output || error) return;
    await navigator.clipboard.writeText(output).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mx-auto mt-8 max-w-2xl text-left">
      {/* Tool selector */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {(Object.keys(DEMOS) as DemoTool[]).map(tool => (
          <button key={tool} onClick={() => switchDemo(tool)}
            className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${selected === tool
              ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
              : "border-border bg-surface text-text-muted hover:bg-surface-hover"}`}>
            {DEMOS[tool].label}
          </button>
        ))}
        {user && (
          <span className="ml-auto text-[10px] text-text-muted">
            ✓ {user.email?.split("@")[0]}
          </span>
        )}
      </div>

      {/* Demo window */}
      <div className="overflow-hidden rounded-lg border border-border bg-[#0e0e13] shadow-xl">
        {/* Title bar */}
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
          </div>
          <span className="text-[11px] text-text-muted font-mono">{demo.title}</span>
          <button onClick={handleCopy} disabled={!output || error}
            className={`rounded p-1 text-xs transition-colors disabled:opacity-30 ${copied ? "text-[var(--accent)]" : "text-text-muted hover:text-text-primary"}`}>
            {copied
              ? <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              : <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M11 5V4a1 1 0 00-1-1H4a1 1 0 00-1 1v6a1 1 0 001 1h1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
            }
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-2 divide-x divide-border">
          <div className="flex flex-col">
            <div className="border-b border-border px-3 py-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">{demo.inputLabel}</span>
            </div>
            <textarea value={input} onChange={e => setInput(e.target.value)} spellCheck={false}
              className="h-32 w-full resize-none bg-transparent p-3 font-mono text-xs text-text-primary outline-none" />
          </div>
          <div className="flex flex-col">
            <div className="border-b border-border px-3 py-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">{demo.outputLabel}</span>
            </div>
            <pre className={`h-32 overflow-auto p-3 font-mono text-xs leading-relaxed ${error ? "text-red-400" : "text-text-primary"}`}>{output}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}