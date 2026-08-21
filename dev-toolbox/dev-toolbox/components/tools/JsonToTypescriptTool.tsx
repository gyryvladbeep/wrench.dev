"use client";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { ToolShell } from "./ToolShell";
import { EmptyToolInput } from "@/components/EmptyState";

function jsonToTs(json: unknown, name = "Root", depth = 0): string {
  if (json === null) return "null";
  if (typeof json === "string")  return "string";
  if (typeof json === "number")  return "number";
  if (typeof json === "boolean") return "boolean";
  if (Array.isArray(json)) {
    if (json.length === 0) return "unknown[]";
    const types = [...new Set(json.map((v) => jsonToTs(v, name, depth)))];
    return types.length === 1 ? `${types[0]}[]` : `(${types.join(" | ")})[]`;
  }
  if (typeof json === "object") {
    const entries = Object.entries(json as Record<string, unknown>);
    if (entries.length === 0) return "Record<string, unknown>";
    const indent = "  ".repeat(depth + 1);
    const fields = entries.map(([k, v]) => {
      const key = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : `"${k}"`;
      const isOpt = v === null || v === undefined;
      const type = jsonToTs(v, k.charAt(0).toUpperCase() + k.slice(1), depth + 1);
      return `${indent}${key}${isOpt ? "?" : ""}: ${type};`;
    }).join("\n");
    return `{\n${fields}\n${"  ".repeat(depth)}}`;
  }
  return "unknown";
}

function buildInterfaces(json: unknown, rootName = "Root"): string {
  const interfaces: string[] = [];
  function process(obj: unknown, name: string): string {
    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return jsonToTs(obj, name);
    const entries = Object.entries(obj as Record<string, unknown>);
    const fields = entries.map(([k, v]) => {
      const key = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : `"${k}"`;
      const childName = k.charAt(0).toUpperCase() + k.slice(1);
      let type: string;
      if (typeof v === "object" && v !== null && !Array.isArray(v)) {
        type = childName; process(v, childName);
      } else if (Array.isArray(v) && v.length > 0 && typeof v[0] === "object" && v[0] !== null) {
        type = `${childName}Item[]`; process(v[0], `${childName}Item`);
      } else {
        type = jsonToTs(v, childName);
      }
      const isOpt = v === null || v === undefined;
      return `  ${key}${isOpt ? "?" : ""}: ${type};`;
    }).join("\n");
    interfaces.unshift(`export interface ${name} {\n${fields}\n}\n`);
    return name;
  }
  process(json, rootName);
  return interfaces.join("\n");
}

const SAMPLE = `{
  "user": {
    "id": 1,
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "roles": ["admin", "user"],
    "address": {
      "city": "London",
      "zip": "W1A 1AA"
    }
  },
  "active": true,
  "score": null
}`;

export function JsonToTypescriptTool({ dict }: { dict: Dictionary }) {
  const [input,    setInput]    = useState(SAMPLE);
  const [rootName, setRootName] = useState("Root");
  const isRu = dict.common.copy === "Копировать";

  const result = useMemo(() => {
    if (!input.trim()) return { ok: true as const, value: "" };
    try {
      const parsed = JSON.parse(input);
      return { ok: true as const, value: buildInterfaces(parsed, rootName || "Root") };
    } catch (e) {
      return { ok: false as const, message: e instanceof Error ? e.message : "Invalid JSON" };
    }
  }, [input, rootName]);

  return (
    <ToolShell onClear={() => setInput("")}
      actions={<>
        <div className="flex items-center gap-2">
          <label className="input-label mb-0">{isRu ? "Имя интерфейса:" : "Root interface:"}</label>
          <input value={rootName} onChange={(e) => setRootName(e.target.value)} placeholder="Root"
            className="code-surface rounded-[8px] px-2.5 py-1.5 text-sm text-text-primary outline-none w-32" />
        </div>
        <div className="ml-auto">
          <CopyButton value={result.ok ? result.value : ""} />
        </div>
      </>}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="input-label">JSON</label>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} rows={16}
            className="code-surface w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none" />
        </div>
        <div>
          <label className="input-label">TypeScript</label>
          {!result.ok
            ? <div className="code-surface min-h-[20rem] rounded-[10px] p-3 text-sm text-red-400 font-mono">{result.message}</div>
            : result.value === ""
              ? <div className="code-surface min-h-[20rem] rounded-[10px] flex items-center justify-center"><EmptyToolInput /></div>
              : <textarea readOnly value={result.value} rows={16} spellCheck={false}
                  className="code-surface w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none" />
          }
        </div>
      </div>
    </ToolShell>
  );
}
