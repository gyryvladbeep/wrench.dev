"use client";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { ToolShell } from "./ToolShell";
import { EmptyToolInput } from "@/components/EmptyState";

// Minimal YAML parser/formatter (handles common cases)
function parseYaml(text: string): unknown {
  const lines = text.split("\n");
  const root: Record<string, unknown> = {};
  const stack: { obj: Record<string, unknown>; indent: number }[] = [{ obj: root, indent: -1 }];

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const indent  = line.search(/\S/);
    const content = line.trim();

    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop();
    const current = stack[stack.length - 1].obj;

    if (content.includes(":")) {
      const colonIdx = content.indexOf(":");
      const key      = content.slice(0, colonIdx).trim();
      const val      = content.slice(colonIdx + 1).trim();

      if (!val) {
        const child: Record<string, unknown> = {};
        current[key] = child;
        stack.push({ obj: child, indent });
      } else if (val === "true") current[key] = true;
      else if (val === "false") current[key] = false;
      else if (val === "null" || val === "~") current[key] = null;
      else if (!isNaN(Number(val))) current[key] = Number(val);
      else current[key] = val.replace(/^["']|["']$/g, "");
    } else if (content.startsWith("- ")) {
      const arr: unknown[] = [];
      current["_list"] = arr;
    }
  }
  return root;
}

function objToYaml(obj: unknown, indent = 0): string {
  const pad = "  ".repeat(indent);
  if (obj === null) return "null";
  if (typeof obj === "boolean") return obj.toString();
  if (typeof obj === "number") return obj.toString();
  if (typeof obj === "string") {
    if (obj.includes(":") || obj.includes("#") || obj.includes("'") || obj.includes('"')) return `"${obj.replace(/"/g, '\\"')}"`;
    return obj;
  }
  if (Array.isArray(obj)) {
    if (obj.length === 0) return "[]";
    return obj.map((v) => `${pad}- ${objToYaml(v, indent + 1)}`).join("\n");
  }
  if (typeof obj === "object") {
    const entries = Object.entries(obj as Record<string, unknown>);
    if (entries.length === 0) return "{}";
    return entries.map(([k, v]) => {
      if (typeof v === "object" && v !== null && !Array.isArray(v)) {
        return `${pad}${k}:\n${objToYaml(v, indent + 1)}`;
      }
      if (Array.isArray(v)) {
        return `${pad}${k}:\n${objToYaml(v, indent + 1)}`;
      }
      return `${pad}${k}: ${objToYaml(v, 0)}`;
    }).join("\n");
  }
  return String(obj);
}

const SAMPLE = `# Server configuration
server:
  host: localhost
  port: 3000
  debug: true

database:
  url: postgres://localhost/myapp
  pool_size: 10
  timeout: 30

features:
  auth: true
  analytics: false
  rate_limit: 100`;

export function YamlFormatterTool({ dict }: { dict: Dictionary }) {
  const [input, setInput]   = useState(SAMPLE);
  const [mode,  setMode]    = useState<"format" | "json">("format");
  const isRu = dict.common.copy === "Копировать";

  const result = useMemo(() => {
    if (!input.trim()) return { ok: true as const, value: "" };
    try {
      const parsed = parseYaml(input);
      const value  = mode === "json"
        ? JSON.stringify(parsed, null, 2)
        : objToYaml(parsed);
      return { ok: true as const, value };
    } catch (e) {
      return { ok: false as const, message: e instanceof Error ? e.message : "Invalid YAML" };
    }
  }, [input, mode]);

  // Count YAML lines and keys
  const stats = useMemo(() => {
    const lines = input.split("\n").filter((l) => l.trim() && !l.trim().startsWith("#")).length;
    const keys  = (input.match(/^\s*\w+:/gm) ?? []).length;
    return { lines, keys };
  }, [input]);

  return (
    <ToolShell onClear={() => setInput("")}
      actions={<>
        <button onClick={() => setMode("format")}
          className={`rounded px-3 py-1.5 text-xs transition-colors ${mode === "format" ? "bg-accent text-accent-fg" : "bg-surface border border-border text-text-muted hover:bg-surface-hover"}`}>
          {isRu ? "Форматировать" : "Format"}
        </button>
        <button onClick={() => setMode("json")}
          className={`rounded px-3 py-1.5 text-xs transition-colors ${mode === "json" ? "bg-accent text-accent-fg" : "bg-surface border border-border text-text-muted hover:bg-surface-hover"}`}>
          {isRu ? "В JSON" : "To JSON"}
        </button>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-text-muted">{stats.lines} {isRu ? "строк" : "lines"} · {stats.keys} {isRu ? "ключей" : "keys"}</span>
          <CopyButton value={result.ok ? result.value : ""} />
        </div>
      </>}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="input-label">YAML {isRu ? "входные данные" : "input"}</label>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} rows={16}
            className="code-surface w-full rounded-lg p-3 font-mono text-sm text-text-primary outline-none" />
        </div>
        <div>
          <label className="input-label">{mode === "json" ? "JSON" : (isRu ? "Форматированный YAML" : "Formatted YAML")}</label>
          {!result.ok
            ? <div className="code-surface min-h-[20rem] rounded-lg p-3 text-sm text-red-400 font-mono">{result.message}</div>
            : result.value === ""
              ? <div className="code-surface min-h-[20rem] rounded-lg flex items-center justify-center"><EmptyToolInput /></div>
              : <textarea readOnly value={result.value} rows={16} spellCheck={false}
                  className="code-surface w-full rounded-lg p-3 font-mono text-sm text-text-primary outline-none" />
          }
        </div>
      </div>
    </ToolShell>
  );
}
