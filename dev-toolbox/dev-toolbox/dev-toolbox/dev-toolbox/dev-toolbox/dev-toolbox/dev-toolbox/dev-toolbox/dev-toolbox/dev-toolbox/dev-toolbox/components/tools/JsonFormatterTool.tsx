"use client";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { ToolShell } from "./ToolShell";
import { EmptyToolInput } from "@/components/EmptyState";

const SAMPLE = `{"name":"Ada Lovelace","born":1815,"skills":["math","programming"],"active":true}`;

export function JsonFormatterTool({ dict }: { dict: Dictionary }) {
  const [input, setInput] = useState(SAMPLE);
  const [indent, setIndent] = useState<2|4|"tab">(2);
  const [mode, setMode]     = useState<"format"|"minify">("format");
  const t = dict.tools.jsonFormatter;

  const result = useMemo(() => {
    if (!input.trim()) return { ok:true as const, value:"" };
    try {
      const parsed = JSON.parse(input);
      const value  = mode==="minify" ? JSON.stringify(parsed) : JSON.stringify(parsed, null, indent==="tab"?"\t":indent);
      return { ok:true as const, value };
    } catch(e) { return { ok:false as const, message: e instanceof Error ? e.message : "Invalid JSON" }; }
  }, [input, mode, indent]);

  return (
    <ToolShell onClear={()=>setInput("")} onRun={()=>setMode("format")}
      actions={<>
        <Button variant={mode==="format"?"primary":"secondary"} size="sm" onClick={()=>setMode("format")}>{t.format}</Button>
        <Button variant={mode==="minify"?"primary":"secondary"} size="sm" onClick={()=>setMode("minify")}>{t.minify}</Button>
        <div className="flex items-center gap-1 text-xs text-text-muted">
          <span>{t.indent}</span>
          {([2,4,"tab"] as const).map((o)=>(
            <button key={String(o)} onClick={()=>setIndent(o)}
              className={`rounded-[6px] px-2 py-1 transition-colors ${indent===o?"bg-accent text-accent-fg":"bg-surface hover:bg-surface-hover"}`}>
              {o==="tab"?t.tab:o}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <CopyButton value={result.ok?result.value:""} />
          <Button variant="secondary" size="sm" disabled={!result.ok||!result.value}
            onClick={()=>{const b=new Blob([result.ok?result.value:""],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="formatted.json";a.click();}}>
            {dict.common.download}
          </Button>
        </div>
      </>}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="input-label">{dict.common.input}</label>
          <textarea value={input} onChange={(e)=>setInput(e.target.value)} spellCheck={false} placeholder={t.placeholder}
            className="code-surface h-72 w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none"/>
        </div>
        <div>
          <label className="input-label">{dict.common.output}</label>
          {!result.ok
            ? <div className="code-surface h-72 rounded-[10px] p-3 flex items-start gap-2 text-sm text-red-400"><span className="shrink-0 mt-0.5">✕</span><span className="font-mono break-all">{result.message}</span></div>
            : result.value===""
              ? <div className="code-surface h-72 rounded-[10px] flex items-center justify-center"><EmptyToolInput/></div>
              : <textarea readOnly value={result.value} spellCheck={false} className="code-surface h-72 w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none"/>
          }
        </div>
      </div>
    </ToolShell>
  );
}
