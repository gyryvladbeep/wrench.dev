"use client";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { ToolShell } from "./ToolShell";
import { EmptyToolInput } from "@/components/EmptyState";

export function Base64Tool({ dict }: { dict: Dictionary }) {
  const [mode, setMode] = useState<"encode"|"decode">("encode");
  const [input, setInput] = useState("Hello, Wrench-Branch!");
  const t    = dict.tools.base64;
  const isRu = dict.common.copy === "Копировать";

  const result = useMemo(() => {
    if (!input) return { ok:true as const, value:"" };
    try {
      if (mode === "encode") {
        const bytes = new TextEncoder().encode(input);
        let bin = "";
        bytes.forEach((b) => (bin += String.fromCharCode(b)));
        return { ok:true as const, value: btoa(bin) };
      } else {
        const bin = atob(input.trim());
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return { ok:true as const, value: new TextDecoder().decode(bytes) };
      }
    } catch {
      return { ok:false as const, message: isRu ? "Невалидная Base64 строка" : "Invalid Base64 string" };
    }
  }, [input, mode, isRu]);

  return (
    <ToolShell onClear={() => setInput("")}
      actions={<>
        <Button variant={mode==="encode"?"primary":"secondary"} size="sm" onClick={()=>setMode("encode")}>{t.encode}</Button>
        <Button variant={mode==="decode"?"primary":"secondary"} size="sm" onClick={()=>setMode("decode")}>{t.decode}</Button>
        <div className="ml-auto">
          <CopyButton value={result.ok ? result.value : ""} />
        </div>
      </>}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="input-label">{mode==="encode" ? (isRu?"Исходный текст":"Plain text") : "Base64"}</label>
          <textarea value={input} onChange={(e)=>setInput(e.target.value)} spellCheck={false} rows={8}
            className="code-surface w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none"/>
        </div>
        <div>
          <label className="input-label">{mode==="encode" ? "Base64" : (isRu?"Декодированный текст":"Decoded text")}</label>
          {!result.ok
            ? <div className="code-surface min-h-[10rem] rounded-[10px] p-3 flex items-start gap-2 text-sm text-red-400"><span>✕</span><span>{result.message}</span></div>
            : result.value === ""
              ? <div className="code-surface min-h-[10rem] rounded-[10px] flex items-center justify-center"><EmptyToolInput/></div>
              : <textarea readOnly value={result.value} spellCheck={false} rows={8}
                  className="code-surface w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none"/>
          }
        </div>
      </div>
    </ToolShell>
  );
}
