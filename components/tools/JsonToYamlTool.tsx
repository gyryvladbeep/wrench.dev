"use client";
import { useMemo, useState } from "react";
import * as yaml from "js-yaml";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

const SAMPLE_JSON = `{
  "name": "Ada Lovelace",
  "born": 1815,
  "skills": ["math", "programming"],
  "active": true
}`;

const SAMPLE_YAML = `name: Ada Lovelace
born: 1815
skills:
  - math
  - programming
active: true`;

export function JsonToYamlTool({ dict }: { dict: Dictionary }) {
  const [mode, setMode] = useState<"json2yaml" | "yaml2json">("json2yaml");
  const [input, setInput] = useState(SAMPLE_JSON);

  const result = useMemo(() => {
    if (!input.trim()) return { ok: true as const, value: "" };
    try {
      if (mode === "json2yaml") {
        const parsed = JSON.parse(input);
        return { ok: true as const, value: yaml.dump(parsed, { indent: 2, lineWidth: -1 }) };
      } else {
        const parsed = yaml.load(input);
        return { ok: true as const, value: JSON.stringify(parsed, null, 2) };
      }
    } catch (e) {
      return { ok: false as const, message: e instanceof Error ? e.message : "Parse error" };
    }
  }, [input, mode]);

  function switchMode() {
    const next = mode === "json2yaml" ? "yaml2json" : "json2yaml";
    if (result.ok && result.value) setInput(result.value.trim());
    setMode(next);
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Button variant={mode === "json2yaml" ? "primary" : "secondary"} onClick={() => { setMode("json2yaml"); setInput(SAMPLE_JSON); }}>JSON → YAML</Button>
        <Button variant={mode === "yaml2json" ? "primary" : "secondary"} onClick={() => { setMode("yaml2json"); setInput(SAMPLE_YAML); }}>YAML → JSON</Button>
        <Button variant="secondary" onClick={switchMode} title="Swap input/output">⇄ Swap</Button>
        <div className="ml-auto">
          <CopyButton value={result.ok ? result.value : ""} label={dict.common.copy} copiedLabel={dict.common.copied} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">{mode === "json2yaml" ? "JSON" : "YAML"}</label>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false}
            className="code-surface h-72 w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">{mode === "json2yaml" ? "YAML" : "JSON"}</label>
          <textarea readOnly value={result.ok ? result.value : `Error: ${result.message}`} spellCheck={false}
            className={`code-surface h-72 w-full rounded-[10px] p-3 font-mono text-sm outline-none ${result.ok ? "text-text-primary" : "text-red-400"}`} />
        </div>
      </div>
    </div>
  );
}
