"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
type Method = typeof METHODS[number];
interface KV { key: string; value: string; }

export function RestRequestBuilderTool({ dict }: { dict: Dictionary }) {
  const t = dict.tools.restBuilder;
  const [method, setMethod] = useState<Method>("GET");
  const [url, setUrl] = useState("https://jsonplaceholder.typicode.com/todos/1");
  const [headers, setHeaders] = useState<KV[]>([{ key: "Content-Type", value: "application/json" }]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState<{ status: number; statusText: string; time: number; body: string } | null>(null);
  const [error, setError] = useState("");

  const hasBody = !["GET", "DELETE"].includes(method);

  async function handleSend() {
    if (!url.trim()) return;
    setSending(true); setError(""); setResponse(null);
    const start = Date.now();
    try {
      const fetchHeaders: Record<string, string> = {};
      headers.filter(h => h.key.trim()).forEach(h => { fetchHeaders[h.key] = h.value; });
      const res = await fetch(url, {
        method,
        headers: fetchHeaders,
        body: hasBody && body.trim() ? body : undefined,
      });
      const ct = res.headers.get("content-type") ?? "";
      let responseBody = "";
      if (ct.includes("json")) {
        responseBody = JSON.stringify(await res.json(), null, 2);
      } else {
        responseBody = await res.text();
      }
      setResponse({ status: res.status, statusText: res.statusText, time: Date.now() - start, body: responseBody });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setSending(false);
    }
  }

  function updateHeader(i: number, field: keyof KV, val: string) {
    setHeaders(prev => prev.map((h, idx) => idx === i ? { ...h, [field]: val } : h));
  }

  const statusColor = response
    ? response.status < 300 ? "text-accent" : response.status < 400 ? "text-yellow-400" : "text-red-400"
    : "";

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <select value={method} onChange={e => setMethod(e.target.value as Method)}
          className="code-surface rounded-[10px] p-2 text-sm font-medium text-text-primary outline-none">
          {METHODS.map(m => <option key={m}>{m}</option>)}
        </select>
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder={t.urlPlaceholder}
          className="code-surface flex-1 rounded-[10px] p-2 font-mono text-sm text-text-primary outline-none" />
        <Button onClick={handleSend} disabled={sending}>{sending ? t.sending : t.send}</Button>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-text-muted">{t.headersLabel}</span>
          <Button variant="secondary" onClick={() => setHeaders(p => [...p, { key: "", value: "" }])}>{t.addHeader}</Button>
        </div>
        {headers.map((h, i) => (
          <div key={i} className="mb-1 flex gap-2">
            <input value={h.key} onChange={e => updateHeader(i, "key", e.target.value)}
              placeholder={t.headerName} className="code-surface flex-1 rounded-[10px] p-2 font-mono text-sm text-text-primary outline-none" />
            <input value={h.value} onChange={e => updateHeader(i, "value", e.target.value)}
              placeholder={t.headerValue} className="code-surface flex-1 rounded-[10px] p-2 font-mono text-sm text-text-primary outline-none" />
            <Button variant="ghost" onClick={() => setHeaders(p => p.filter((_, j) => j !== i))}>✕</Button>
          </div>
        ))}
      </div>

      {hasBody && (
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">{t.bodyLabel}</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} spellCheck={false}
            className="code-surface h-32 w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none" />
        </div>
      )}

      {error && (
        <div className="rounded-[10px] border border-red-500/30 bg-red-500/10 p-3">
          <p className="text-sm text-red-400">{error}</p>
          <p className="mt-1 text-xs text-text-muted">{t.corsNote}</p>
        </div>
      )}

      {response && (
        <div>
          <div className="mb-2 flex items-center gap-4">
            <span className="text-xs text-text-muted">
              {t.statusLabel} <span className={`font-medium ${statusColor}`}>{response.status} {response.statusText}</span>
            </span>
            <span className="text-xs text-text-muted">{response.time}{t.timeMs}</span>
            <div className="ml-auto">
              <CopyButton value={response.body} label={t.copyResponse} copiedLabel={dict.common.copied} />
            </div>
          </div>
          <textarea readOnly value={response.body} spellCheck={false}
            className="code-surface h-64 w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none" />
        </div>
      )}
    </div>
  );
}
