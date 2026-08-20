"use client";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

function encodeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function decodeHtml(str: string): string {
  const el = document.createElement("div");
  el.innerHTML = str;
  return el.textContent ?? el.innerText ?? "";
}

export function HtmlEncodeDecodeTool({ dict }: { dict: Dictionary }) {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState('<p class="greeting">Hello & <strong>World</strong>!</p>');

  const result = useMemo(() => {
    if (!input) return { ok: true as const, value: "" };
    try {
      const value = mode === "encode" ? encodeHtml(input) : decodeHtml(input);
      return { ok: true as const, value };
    } catch (e) {
      return { ok: false as const, message: e instanceof Error ? e.message : "Error" };
    }
  }, [input, mode]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Button variant={mode === "encode" ? "primary" : "secondary"} onClick={() => setMode("encode")}>Encode</Button>
        <Button variant={mode === "decode" ? "primary" : "secondary"} onClick={() => setMode("decode")}>Decode</Button>
        <div className="ml-auto">
          <CopyButton value={result.ok ? result.value : ""} label={dict.common.copy} copiedLabel={dict.common.copied} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">{mode === "encode" ? "HTML" : "Encoded HTML"}</label>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false}
            className="code-surface h-56 w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">{mode === "encode" ? "Encoded" : "Decoded HTML"}</label>
          <textarea readOnly value={result.ok ? result.value : result.message} spellCheck={false}
            className={`code-surface h-56 w-full rounded-[10px] p-3 font-mono text-sm outline-none ${result.ok ? "text-text-primary" : "text-red-400"}`} />
        </div>
      </div>
    </div>
  );
}
