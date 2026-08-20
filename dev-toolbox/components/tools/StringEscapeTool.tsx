"use client";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { ToolShell } from "./ToolShell";
import { EmptyToolInput } from "@/components/EmptyState";

type Mode = "json" | "html" | "url" | "regex" | "sql" | "csv";

const MODES: { id: Mode; label: string }[] = [
  { id: "json",  label: "JSON"  },
  { id: "html",  label: "HTML"  },
  { id: "url",   label: "URL"   },
  { id: "regex", label: "Regex" },
  { id: "sql",   label: "SQL"   },
  { id: "csv",   label: "CSV"   },
];

function escape(text: string, mode: Mode, encode: boolean): string {
  if (encode) {
    switch (mode) {
      case "json":  return text.replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/\n/g,"\\n").replace(/\r/g,"\\r").replace(/\t/g,"\\t");
      case "html":  return text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
      case "url":   return encodeURIComponent(text);
      case "regex": return text.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
      case "sql":   return text.replace(/'/g,"''").replace(/\\/g,"\\\\");
      case "csv":   return text.includes(",") || text.includes('"') || text.includes("\n") ? `"${text.replace(/"/g,'""')}"` : text;
    }
  } else {
    switch (mode) {
      case "json":  return text.replace(/\\n/g,"\n").replace(/\\r/g,"\r").replace(/\\t/g,"\t").replace(/\\"/g,'"').replace(/\\\\/g,"\\");
      case "html":  return text.replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;/g,"'");
      case "url":   return decodeURIComponent(text);
      case "regex": return text.replace(/\\([.*+?^${}()|[\]\\])/g,"$1");
      case "sql":   return text.replace(/''/g,"'").replace(/\\\\/g,"\\");
      case "csv":   return text.replace(/^"|"$/g,"").replace(/""/g,'"');
    }
  }
}

const SAMPLE: Record<Mode, string> = {
  json:  `Hello "World"\nNew line\tTabbed`,
  html:  `<script>alert('XSS')</script> & more`,
  url:   `search query with spaces & symbols=true`,
  regex: `https://example.com/path?q=test`,
  sql:   `O'Brien's "special" value`,
  csv:   `value with "quotes" and, commas`,
};

export function StringEscapeTool({ dict }: { dict: Dictionary }) {
  const [input,  setInput]  = useState(SAMPLE.json);
  const [mode,   setMode]   = useState<Mode>("json");
  const [encode, setEncode] = useState(true);
  const isRu = dict.common.copy === "Копировать";

  const output = useMemo(() => {
    if (!input) return "";
    try { return escape(input, mode, encode); } catch { return input; }
  }, [input, mode, encode]);

  function handleModeChange(m: Mode) {
    setMode(m);
    setInput(SAMPLE[m]);
  }

  return (
    <ToolShell onClear={() => setInput("")}
      actions={<>
        <div className="flex rounded border border-border overflow-hidden">
          {MODES.map((m) => (
            <button key={m.id} onClick={() => handleModeChange(m.id)}
              className={`px-3 py-1.5 text-xs transition-colors ${mode === m.id ? "bg-accent text-accent-fg" : "bg-surface text-text-muted hover:bg-surface-hover"}`}>
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex rounded border border-border overflow-hidden">
          <button onClick={() => setEncode(true)}
            className={`px-3 py-1.5 text-xs transition-colors ${encode ? "bg-surface-hover text-text-primary" : "bg-surface text-text-muted hover:bg-surface-hover"}`}>
            {isRu ? "Escape" : "Escape"}
          </button>
          <button onClick={() => setEncode(false)}
            className={`px-3 py-1.5 text-xs transition-colors ${!encode ? "bg-surface-hover text-text-primary" : "bg-surface text-text-muted hover:bg-surface-hover"}`}>
            {isRu ? "Unescape" : "Unescape"}
          </button>
        </div>
        <div className="ml-auto"><CopyButton value={output} /></div>
      </>}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="input-label">{isRu ? "Входной текст" : "Input"}</label>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} rows={10}
            className="code-surface w-full rounded-lg p-3 font-mono text-sm text-text-primary outline-none" />
        </div>
        <div>
          <label className="input-label">{encode ? (isRu ? "Экранированный" : "Escaped") : (isRu ? "Деэкранированный" : "Unescaped")}</label>
          {output === ""
            ? <div className="code-surface min-h-[14rem] rounded-lg flex items-center justify-center"><EmptyToolInput /></div>
            : <textarea readOnly value={output} rows={10} spellCheck={false}
                className="code-surface w-full rounded-lg p-3 font-mono text-sm text-text-primary outline-none" />
          }
        </div>
      </div>
    </ToolShell>
  );
}
