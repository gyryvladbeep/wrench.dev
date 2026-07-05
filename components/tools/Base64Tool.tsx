"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function base64ToUtf8(b64: string): string {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function Base64Tool({ dict }: { dict: Dictionary }) {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("Hello, Dev Toolbox!");
  const t = dict.tools.base64;

  const result = useMemo(() => {
    if (!input) return { ok: true as const, value: "" };
    try {
      const value = mode === "encode" ? utf8ToBase64(input) : base64ToUtf8(input.trim());
      return { ok: true as const, value };
    } catch {
      return { ok: false as const, message: t.invalidInput };
    }
  }, [input, mode, t.invalidInput]);

  return (
    <div>
      <div className="flex items-center gap-2">
        <Button variant={mode === "encode" ? "primary" : "secondary"} onClick={() => setMode("encode")}>
          {t.encode}
        </Button>
        <Button variant={mode === "decode" ? "primary" : "secondary"} onClick={() => setMode("decode")}>
          {t.decode}
        </Button>
        <div className="ml-auto">
          <CopyButton value={result.ok ? result.value : ""} label={dict.common.copy} copiedLabel={dict.common.copied} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="b64-input" className="mb-1 block text-xs font-medium text-text-muted">
            {mode === "encode" ? t.plainText : t.base64Label}
          </label>
          <textarea
            id="b64-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            className="code-surface h-56 w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none"
          />
        </div>
        <div>
          <label htmlFor="b64-output" className="mb-1 block text-xs font-medium text-text-muted">
            {mode === "encode" ? t.base64Label : t.plainText}
          </label>
          <textarea
            id="b64-output"
            readOnly
            value={result.ok ? result.value : result.message}
            spellCheck={false}
            className={`code-surface h-56 w-full rounded-[10px] p-3 font-mono text-sm outline-none ${
              result.ok ? "text-text-primary" : "text-red-400"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
