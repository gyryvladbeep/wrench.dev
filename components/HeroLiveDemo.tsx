"use client";

import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";

const SAMPLE = `{"tool":"Dev Toolbox","fast":true,"signup":null}`;

/** A tiny live JSON formatter embedded directly in the hero — the product's
 *  "try before you click" signature: the homepage itself proves the value
 *  prop in under five seconds, with zero navigation required. */
export function HeroLiveDemo({ dict }: { dict: Dictionary }) {
  const [input, setInput] = useState(SAMPLE);

  const output = useMemo(() => {
    try {
      return JSON.stringify(JSON.parse(input), null, 2);
    } catch {
      return dict.heroDemo.placeholderComment;
    }
  }, [input, dict]);

  return (
    <div className="mt-8 grid grid-cols-1 gap-3 rounded-[10px] border border-border bg-surface p-3 sm:grid-cols-2">
      <textarea
        aria-label={dict.heroDemo.ariaLabel}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        spellCheck={false}
        className="code-surface h-32 w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none"
      />
      <pre className="code-surface h-32 overflow-auto rounded-[10px] p-3 text-left font-mono text-sm text-text-primary">
        {output}
      </pre>
    </div>
  );
}
