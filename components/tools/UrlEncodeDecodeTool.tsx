"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

export function UrlEncodeDecodeTool({ dict }: { dict: Dictionary }) {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("https://example.com/search?q=dev toolbox & more");
  const [component, setComponent] = useState(true); // encodeURIComponent vs encodeURI
  const t = dict.tools.urlEncode;

  const result = useMemo(() => {
    if (!input) return { ok: true as const, value: "" };
    try {
      const value =
        mode === "encode"
          ? component
            ? encodeURIComponent(input)
            : encodeURI(input)
          : component
          ? decodeURIComponent(input)
          : decodeURI(input);
      return { ok: true as const, value };
    } catch {
      return { ok: false as const, message: t.invalidInput };
    }
  }, [input, mode, component, t.invalidInput]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant={mode === "encode" ? "primary" : "secondary"} onClick={() => setMode("encode")}>
          {t.encode}
        </Button>
        <Button variant={mode === "decode" ? "primary" : "secondary"} onClick={() => setMode("decode")}>
          {t.decode}
        </Button>
        <label className="ml-2 flex items-center gap-2 text-sm text-text-muted">
          <input type="checkbox" checked={component} onChange={(e) => setComponent(e.target.checked)} />
          {t.componentCheckbox}
        </label>
        <div className="ml-auto">
          <CopyButton value={result.ok ? result.value : ""} label={dict.common.copy} copiedLabel={dict.common.copied} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="url-input" className="mb-1 block text-xs font-medium text-text-muted">
            {dict.common.input}
          </label>
          <textarea
            id="url-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            className="code-surface h-40 w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none"
          />
        </div>
        <div>
          <label htmlFor="url-output" className="mb-1 block text-xs font-medium text-text-muted">
            {dict.common.output}
          </label>
          <textarea
            id="url-output"
            readOnly
            value={result.ok ? result.value : result.message}
            spellCheck={false}
            className={`code-surface h-40 w-full rounded-[10px] p-3 font-mono text-sm outline-none ${
              result.ok ? "text-text-primary" : "text-red-400"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
