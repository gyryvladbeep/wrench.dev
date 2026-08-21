"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

interface HeaderRow {
  key: string;
  value: string;
}

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

function shQuote(value: string): string {
  // Single-quote, escaping any embedded single quotes the POSIX-safe way.
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

export function CurlGeneratorTool({ dict }: { dict: Dictionary }) {
  const [method, setMethod] = useState<typeof METHODS[number]>("GET");
  const [url, setUrl] = useState("https://api.example.com/v1/users");
  const [headers, setHeaders] = useState<HeaderRow[]>([{ key: "Content-Type", value: "application/json" }]);
  const [body, setBody] = useState('{\n  "name": "Ada"\n}');
  const t = dict.tools.curl;

  const command = useMemo(() => {
    const parts = ["curl", "-X", method];
    headers
      .filter((h) => h.key.trim())
      .forEach((h) => parts.push("-H", shQuote(`${h.key}: ${h.value}`)));
    if (body.trim() && method !== "GET") {
      parts.push("-d", shQuote(body));
    }
    parts.push(shQuote(url || ""));
    return parts.join(" \\\n  ");
  }, [method, url, headers, body]);

  function updateHeader(index: number, field: keyof HeaderRow, value: string) {
    setHeaders((prev) => prev.map((h, i) => (i === index ? { ...h, [field]: value } : h)));
  }

  function addHeader() {
    setHeaders((prev) => [...prev, { key: "", value: "" }]);
  }

  function removeHeader(index: number) {
    setHeaders((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as typeof METHODS[number])}
          className="code-surface rounded-[10px] p-2 text-sm text-text-primary outline-none"
        >
          {METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t.urlPlaceholder}
          className="code-surface flex-1 rounded-[10px] p-2 font-mono text-sm text-text-primary outline-none"
        />
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-text-muted">{t.headersLabel}</span>
          <Button variant="secondary" onClick={addHeader}>
            {t.addHeader}
          </Button>
        </div>
        <div className="space-y-2">
          {headers.map((h, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={h.key}
                onChange={(e) => updateHeader(i, "key", e.target.value)}
                placeholder={t.headerNamePlaceholder}
                className="code-surface flex-1 rounded-[10px] p-2 font-mono text-sm text-text-primary outline-none"
              />
              <input
                value={h.value}
                onChange={(e) => updateHeader(i, "value", e.target.value)}
                placeholder={t.valuePlaceholder}
                className="code-surface flex-1 rounded-[10px] p-2 font-mono text-sm text-text-primary outline-none"
              />
              <Button variant="ghost" onClick={() => removeHeader(i)} aria-label={t.removeHeaderAria}>
                ✕
              </Button>
            </div>
          ))}
        </div>
      </div>

      {method !== "GET" && (
        <div className="mt-4">
          <label htmlFor="curl-body" className="mb-1 block text-xs font-medium text-text-muted">
            {t.bodyLabel}
          </label>
          <textarea
            id="curl-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            spellCheck={false}
            className="code-surface h-32 w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none"
          />
        </div>
      )}

      <div className="mt-6">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-text-muted">{t.commandLabel}</span>
          <CopyButton value={command} label={dict.common.copy} copiedLabel={dict.common.copied} />
        </div>
        <pre className="code-surface overflow-auto rounded-[10px] p-3 font-mono text-sm text-text-primary">
          {command}
        </pre>
      </div>
    </div>
  );
}
