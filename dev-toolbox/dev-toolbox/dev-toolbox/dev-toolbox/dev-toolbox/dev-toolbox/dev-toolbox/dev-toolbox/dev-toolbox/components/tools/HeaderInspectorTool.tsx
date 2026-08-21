"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

interface HeadersResult { status: number; statusText: string; headers: Record<string, string>; }

export function HeaderInspectorTool({ dict }: { dict: Dictionary }) {
  const [url, setUrl] = useState("https://example.com");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HeadersResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const t = dict.tools.headerInspector;

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/headers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Request failed."); }
      else { setResult(data); }
    } catch {
      setError(t.networkError);
    } finally {
      setLoading(false);
    }
  }

  const headerLines = result
    ? Object.entries(result.headers).map(([k, v]) => `${k}: ${v}`).join("\n")
    : "";

  return (
    <div>
      <form onSubmit={handleCheck} className="flex gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t.urlPlaceholder}
          className="code-surface flex-1 rounded-[10px] p-2 font-mono text-sm text-text-primary outline-none"
        />
        <Button type="submit" disabled={loading}>
          {loading ? t.checking : t.inspect}
        </Button>
      </form>
      <p className="mt-2 text-xs text-text-muted">{t.note}</p>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      {result && (
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm text-text-primary">{result.status} {result.statusText}</span>
            <CopyButton value={headerLines} label={dict.common.copy} copiedLabel={dict.common.copied} />
          </div>
          <pre className="code-surface max-h-96 overflow-auto rounded-[10px] p-3 font-mono text-sm text-text-primary">
            {headerLines}
          </pre>
        </div>
      )}
    </div>
  );
}
