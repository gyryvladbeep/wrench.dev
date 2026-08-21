"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

function generateUuid(): string {
  // crypto.randomUUID() is cryptographically secure and supported in all modern browsers.
  return crypto.randomUUID();
}

export function UuidGeneratorTool({ dict }: { dict: Dictionary }) {
  const [count, setCount] = useState(5);
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [uuids, setUuids] = useState<string[]>(() => Array.from({ length: 5 }, generateUuid));
  const t = dict.tools.uuid;

  function handleGenerate() {
    setUuids(Array.from({ length: Math.min(Math.max(count, 1), 1000) }, generateUuid));
  }

  function format(u: string): string {
    let v = hyphens ? u : u.replace(/-/g, "");
    if (uppercase) v = v.toUpperCase();
    return v;
  }

  const formatted = uuids.map(format);
  const joined = formatted.join("\n");

  return (
    <div>
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="uuid-count" className="mb-1 block text-xs font-medium text-text-muted">
            {t.howMany}
          </label>
          <input
            id="uuid-count"
            type="number"
            min={1}
            max={1000}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="code-surface w-24 rounded-[10px] p-2 text-sm text-text-primary outline-none"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-text-muted">
          <input type="checkbox" checked={uppercase} onChange={(e) => setUppercase(e.target.checked)} />
          {t.uppercase}
        </label>
        <label className="flex items-center gap-2 text-sm text-text-muted">
          <input type="checkbox" checked={hyphens} onChange={(e) => setHyphens(e.target.checked)} />
          {t.hyphens}
        </label>
        <Button onClick={handleGenerate}>{t.generate}</Button>
        <div className="ml-auto">
          <CopyButton value={joined} label={t.copyAll} copiedLabel={dict.common.copied} />
        </div>
      </div>

      <textarea
        readOnly
        value={joined}
        spellCheck={false}
        className="code-surface mt-4 h-64 w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none"
      />
    </div>
  );
}
