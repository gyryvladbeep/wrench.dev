"use client";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { ToolShell } from "./ToolShell";
import { EmptyToolInput } from "@/components/EmptyState";

export function UrlEncodeDecodeTool({ dict }: { dict: Dictionary }) {
  const [mode, setMode] = useState<"encode"|"decode">("encode");
  const [input, setInput] = useState("https://example.com/search?q=hello world&lang=en");
  const t    = dict.tools.urlEncode;
  const isRu = dict.common.copy === "Копировать";

  const result = useMemo(() => {
    if (!input) return { ok:true as const, value:"" };
    try {
      return { ok:true as const, value: mode==="encode" ? encodeURIComponent(input) : decodeURIComponent(input) };
    } catch {
      return { ok:false as const, message: isRu?"Невалидная строка":"Invalid encoded string" };
    }
  }, [input, mode, isRu]);

  return (
    <ToolShell onClear={()=>setInput("")}
      actions={<>
        <Button variant={mode==="encode"?"primary":"secondary"} size="sm" onClick={()=>setMode("encode")}>{t.encode}</Button>
        <Button variant={mode==="decode"?"primary":"secondary"} size="sm" onClick={()=>setMode("decode")}>{t.decode}</Button>
        <div className="ml-auto"><CopyButton value={result.ok?result.value:""}/></div>
      </>}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="input-label">{mode==="encode"?(isRu?"Исходный URL":"Plain URL"):"Encoded URL"}</label>
          <textarea value={input} onChange={(e)=>setInput(e.target.value)} spellCheck={false} rows={6}
            className="code-surface w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none"/>
        </div>
        <div>
          <label className="input-label">{mode==="encode"?"Encoded":(isRu?"Декодированный URL":"Decoded URL")}</label>
          {!result.ok
            ? <div className="code-surface min-h-[8rem] rounded-[10px] p-3 text-sm text-red-400">{result.message}</div>
            : result.value===""
              ? <div className="code-surface min-h-[8rem] rounded-[10px] flex items-center justify-center"><EmptyToolInput/></div>
              : <textarea readOnly value={result.value} spellCheck={false} rows={6}
                  className="code-surface w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none"/>
          }
        </div>
      </div>
    </ToolShell>
  );
}
