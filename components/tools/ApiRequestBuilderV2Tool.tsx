"use client";
import { useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

interface Header { key: string; value: string; enabled: boolean; }
interface Param  { key: string; value: string; enabled: boolean; }

const METHODS = ["GET","POST","PUT","PATCH","DELETE","HEAD","OPTIONS"];
const STATUS_COLORS: Record<string, string> = {
  "2":"text-success", "3":"text-blue-400", "4":"text-amber-400", "5":"text-red-400"
};

export function ApiRequestBuilderV2Tool({ dict }: { dict: Dictionary }) {
  const isRu = dict.common.copy === "Kopировать" || dict.common.copy === "Копировать";
  const [method,  setMethod]  = useState("GET");
  const [url,     setUrl]     = useState("https://jsonplaceholder.typicode.com/posts/1");
  const [headers, setHeaders] = useState<Header[]>([
    { key:"Content-Type", value:"application/json", enabled:true },
    { key:"Accept",       value:"application/json", enabled:true },
  ]);
  const [params,  setParams]  = useState<Param[]>([{ key:"", value:"", enabled:true }]);
  const [body,    setBody]    = useState('{\n  "title": "Test Post",\n  "body": "Content here",\n  "userId": 1\n}');
  const [tab,     setTab]     = useState<"params"|"headers"|"body">("params");
  const [response, setResp]   = useState<{ status: number; headers: Record<string,string>; body: string; time: number } | null>(null);
  const [loading, setLoading] = useState(false);

  function addHeader() { setHeaders(h => [...h, { key:"", value:"", enabled:true }]); }
  function addParam()  { setParams(p => [...p, { key:"", value:"", enabled:true }]); }

  function buildUrl() {
    const enabledParams = params.filter(p => p.enabled && p.key);
    if (!enabledParams.length) return url;
    const qs = enabledParams.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join("&");
    return url + (url.includes("?") ? "&" : "?") + qs;
  }

  async function sendRequest() {
    setLoading(true);
    setResp(null);
    const start = Date.now();
    try {
      const reqHeaders: Record<string,string> = {};
      headers.filter(h => h.enabled && h.key).forEach(h => { reqHeaders[h.key] = h.value; });

      const opts: RequestInit = { method, headers: reqHeaders };
      if (!["GET","HEAD"].includes(method) && body) opts.body = body;

      const res = await fetch(buildUrl(), opts);
      const text = await res.text();
      const respHeaders: Record<string,string> = {};
      res.headers.forEach((v, k) => { respHeaders[k] = v; });

      let formatted = text;
      try { formatted = JSON.stringify(JSON.parse(text), null, 2); } catch {}

      setResp({ status: res.status, headers: respHeaders, body: formatted, time: Date.now() - start });
    } catch (e) {
      setResp({ status: 0, headers: {}, body: e instanceof Error ? e.message : "Network error", time: Date.now() - start });
    }
    setLoading(false);
  }

  const statusColor = response ? (STATUS_COLORS[String(response.status)[0]] ?? "text-text-muted") : "";

  return (
    <div className="space-y-4">
      {/* URL bar */}
      <div className="flex gap-2">
        <select value={method} onChange={e => setMethod(e.target.value)}
          className="code-surface rounded-lg px-3 py-2.5 text-sm font-mono font-semibold text-accent outline-none w-28 shrink-0">
          {METHODS.map(m => <option key={m}>{m}</option>)}
        </select>
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..."
          className="code-surface flex-1 rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none font-mono" />
        <button onClick={sendRequest} disabled={loading}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg hover:bg-amber-400 disabled:opacity-60 transition-colors shrink-0">
          {loading ? "..." : (isRu ? "Отправить" : "Send")}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded border border-border overflow-hidden w-fit">
        {(["params","headers","body"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-xs capitalize transition-colors ${tab === t ? "bg-accent text-accent-fg" : "bg-surface text-text-muted hover:bg-surface-hover"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "params" && (
        <div className="space-y-1.5">
          {params.map((p, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input type="checkbox" checked={p.enabled} onChange={e => setParams(ps => ps.map((x,j) => j===i ? {...x, enabled:e.target.checked} : x))} className="accent-accent" />
              <input value={p.key} onChange={e => setParams(ps => ps.map((x,j) => j===i ? {...x, key:e.target.value} : x))} placeholder="key"
                className="code-surface flex-1 rounded px-2 py-1.5 text-xs text-text-primary outline-none" />
              <input value={p.value} onChange={e => setParams(ps => ps.map((x,j) => j===i ? {...x, value:e.target.value} : x))} placeholder="value"
                className="code-surface flex-1 rounded px-2 py-1.5 text-xs text-text-primary outline-none" />
              <button onClick={() => setParams(ps => ps.filter((_,j) => j!==i))} className="text-text-disabled hover:text-error transition-colors text-xs">✕</button>
            </div>
          ))}
          <button onClick={addParam} className="text-xs text-link hover:underline">+ {isRu ? "Добавить параметр" : "Add parameter"}</button>
        </div>
      )}

      {tab === "headers" && (
        <div className="space-y-1.5">
          {headers.map((h, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input type="checkbox" checked={h.enabled} onChange={e => setHeaders(hs => hs.map((x,j) => j===i ? {...x, enabled:e.target.checked} : x))} className="accent-accent" />
              <input value={h.key} onChange={e => setHeaders(hs => hs.map((x,j) => j===i ? {...x, key:e.target.value} : x))} placeholder="Header-Name"
                className="code-surface flex-1 rounded px-2 py-1.5 text-xs text-text-primary outline-none" />
              <input value={h.value} onChange={e => setHeaders(hs => hs.map((x,j) => j===i ? {...x, value:e.target.value} : x))} placeholder="value"
                className="code-surface flex-1 rounded px-2 py-1.5 text-xs text-text-primary outline-none" />
              <button onClick={() => setHeaders(hs => hs.filter((_,j) => j!==i))} className="text-text-disabled hover:text-error transition-colors text-xs">✕</button>
            </div>
          ))}
          <button onClick={addHeader} className="text-xs text-link hover:underline">+ {isRu ? "Добавить заголовок" : "Add header"}</button>
        </div>
      )}

      {tab === "body" && !["GET","HEAD"].includes(method) && (
        <textarea value={body} onChange={e => setBody(e.target.value)} rows={8} spellCheck={false}
          className="code-surface w-full rounded-lg p-3 font-mono text-sm text-text-primary outline-none" />
      )}
      {tab === "body" && ["GET","HEAD"].includes(method) && (
        <p className="text-xs text-text-muted">{isRu ? `${method} запросы не имеют тела` : `${method} requests have no body`}</p>
      )}

      {/* Response */}
      {response && (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="flex items-center gap-4 border-b border-border bg-surface px-4 py-2.5">
            <span className={`font-mono text-sm font-bold ${statusColor}`}>
              {response.status === 0 ? "ERROR" : response.status}
            </span>
            <span className="text-xs text-text-muted">{response.time}ms</span>
            <div className="ml-auto"><CopyButton value={response.body} /></div>
          </div>
          <textarea readOnly value={response.body} rows={12} spellCheck={false}
            className="w-full bg-canvas p-4 font-mono text-xs text-text-primary outline-none" />
        </div>
      )}
    </div>
  );
}