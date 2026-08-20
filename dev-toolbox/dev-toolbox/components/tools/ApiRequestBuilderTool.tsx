"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const;
type Method = typeof METHODS[number];

interface KV { key: string; value: string; }

function buildUrl(base: string, params: KV[]): string {
  const active = params.filter(p => p.key.trim());
  if (!active.length) return base;
  const qs = active.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join("&");
  return `${base}${base.includes("?") ? "&" : "?"}${qs}`;
}

export function ApiRequestBuilderTool({ dict }: { dict: Dictionary }) {
  const t = dict.tools.apiBuilder;
  const [method, setMethod] = useState<Method>("GET");
  const [url, setUrl] = useState("https://jsonplaceholder.typicode.com/posts/1");
  const [headers, setHeaders] = useState<KV[]>([{ key: "Accept", value: "application/json" }]);
  const [params, setParams] = useState<KV[]>([{ key: "", value: "" }]);
  const [body, setBody] = useState('{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}');
  const [contentType, setContentType] = useState("application/json");
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState<{
    status: number; statusText: string; time: number;
    body: string; headers: Record<string, string>;
  } | null>(null);
  const [error, setError] = useState("");

  const hasBody = !["GET", "HEAD", "OPTIONS"].includes(method);

  const finalUrl = buildUrl(url, params);

  const requestPreview = [
    `${method} ${finalUrl}`,
    ...headers.filter(h => h.key.trim()).map(h => `${h.key}: ${h.value}`),
    hasBody ? `Content-Type: ${contentType}` : "",
    hasBody && body.trim() ? `\n${body}` : "",
  ].filter(Boolean).join("\n");

  async function handleSend() {
    if (!url.trim()) return;
    setSending(true); setError(""); setResponse(null);
    const start = Date.now();
    try {
      const fetchHeaders: Record<string, string> = {};
      headers.filter(h => h.key.trim()).forEach(h => { fetchHeaders[h.key] = h.value; });
      if (hasBody) fetchHeaders["Content-Type"] = contentType;

      const res = await fetch(finalUrl, {
        method,
        headers: fetchHeaders,
        body: hasBody && body.trim() ? body : undefined,
      });

      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => { responseHeaders[k] = v; });

      let responseBody = "";
      const ct = res.headers.get("content-type") ?? "";
      if (ct.includes("json")) {
        const json = await res.json();
        responseBody = JSON.stringify(json, null, 2);
      } else {
        responseBody = await res.text();
      }

      setResponse({
        status: res.status, statusText: res.statusText,
        time: Date.now() - start, body: responseBody, headers: responseHeaders,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setSending(false);
    }
  }

  function updateKV(list: KV[], setList: (v: KV[]) => void, idx: number, field: keyof KV, val: string) {
    const next = list.map((item, i) => i === idx ? { ...item, [field]: val } : item);
    setList(next);
  }
  function addKV(list: KV[], setList: (v: KV[]) => void) { setList([...list, { key: "", value: "" }]); }
  function removeKV(list: KV[], setList: (v: KV[]) => void, idx: number) { setList(list.filter((_, i) => i !== idx)); }

  const statusColor = response
    ? response.status < 300 ? "text-accent" : response.status < 400 ? "text-yellow-400" : "text-red-400"
    : "";

  return (
    <div className="space-y-4">
      {/* URL bar */}
      <div className="flex flex-wrap gap-2">
        <select
          value={method}
          onChange={e => setMethod(e.target.value as Method)}
          className="code-surface rounded-[10px] p-2 text-sm font-medium text-text-primary outline-none"
        >
          {METHODS.map(m => <option key={m}>{m}</option>)}
        </select>
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder={t.urlPlaceholder}
          className="code-surface flex-1 rounded-[10px] p-2 font-mono text-sm text-text-primary outline-none"
        />
        <Button onClick={handleSend} disabled={sending}>
          {sending ? t.sending : t.send}
        </Button>
      </div>

      {/* Params */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-text-muted">{t.paramsLabel}</span>
          <Button variant="secondary" onClick={() => addKV(params, setParams)}>{t.addParam}</Button>
        </div>
        {params.map((p, i) => (
          <div key={i} className="mb-1 flex gap-2">
            <input value={p.key} onChange={e => updateKV(params, setParams, i, "key", e.target.value)}
              placeholder={t.paramName} className="code-surface flex-1 rounded-[10px] p-2 font-mono text-sm text-text-primary outline-none" />
            <input value={p.value} onChange={e => updateKV(params, setParams, i, "value", e.target.value)}
              placeholder={t.paramValue} className="code-surface flex-1 rounded-[10px] p-2 font-mono text-sm text-text-primary outline-none" />
            <Button variant="ghost" onClick={() => removeKV(params, setParams, i)}>✕</Button>
          </div>
        ))}
      </div>

      {/* Headers */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-text-muted">{t.headersLabel}</span>
          <Button variant="secondary" onClick={() => addKV(headers, setHeaders)}>{t.addHeader}</Button>
        </div>
        {headers.map((h, i) => (
          <div key={i} className="mb-1 flex gap-2">
            <input value={h.key} onChange={e => updateKV(headers, setHeaders, i, "key", e.target.value)}
              placeholder={t.headerName} className="code-surface flex-1 rounded-[10px] p-2 font-mono text-sm text-text-primary outline-none" />
            <input value={h.value} onChange={e => updateKV(headers, setHeaders, i, "value", e.target.value)}
              placeholder={t.headerValue} className="code-surface flex-1 rounded-[10px] p-2 font-mono text-sm text-text-primary outline-none" />
            <Button variant="ghost" onClick={() => removeKV(headers, setHeaders, i)}>✕</Button>
          </div>
        ))}
      </div>

      {/* Body */}
      {hasBody && (
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xs font-medium text-text-muted">{t.bodyLabel}</span>
            <select value={contentType} onChange={e => setContentType(e.target.value)}
              className="code-surface ml-auto rounded-[10px] p-1 text-xs text-text-muted outline-none">
              <option value="application/json">application/json</option>
              <option value="application/x-www-form-urlencoded">form-urlencoded</option>
              <option value="text/plain">text/plain</option>
              <option value="application/xml">application/xml</option>
            </select>
          </div>
          <textarea value={body} onChange={e => setBody(e.target.value)} spellCheck={false}
            className="code-surface h-32 w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none" />
        </div>
      )}

      {/* Request preview */}
      <details>
        <summary className="cursor-pointer text-xs text-text-muted hover:text-text-primary">{t.requestPreviewLabel}</summary>
        <pre className="code-surface mt-2 rounded-[10px] p-3 font-mono text-xs text-text-primary">{requestPreview}</pre>
      </details>

      {/* Error */}
      {error && (
        <div className="rounded-[10px] border border-red-500/30 bg-red-500/10 p-3">
          <p className="text-sm text-red-400">{error}</p>
          <p className="mt-1 text-xs text-text-muted">{t.corsNote}</p>
        </div>
      )}

      {/* Response */}
      {response && (
        <div>
          <div className="mb-2 flex items-center gap-4">
            <span className="text-xs text-text-muted">{t.statusLabel} <span className={`font-medium ${statusColor}`}>{response.status} {response.statusText}</span></span>
            <span className="text-xs text-text-muted">{t.timeLabel} {response.time}ms</span>
            <div className="ml-auto">
              <CopyButton value={response.body} label={dict.common.copy} copiedLabel={dict.common.copied} />
            </div>
          </div>
          <textarea readOnly value={response.body} spellCheck={false}
            className="code-surface h-64 w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none" />
        </div>
      )}
    </div>
  );
}
