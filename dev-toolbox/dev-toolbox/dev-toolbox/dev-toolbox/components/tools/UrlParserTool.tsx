"use client";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { ToolShell } from "./ToolShell";

const SAMPLE = "https://api.example.com:8080/v1/users?role=admin&active=true&page=2#results";

export function UrlParserTool({ dict }: { dict: Dictionary }) {
  const [input, setInput] = useState(SAMPLE);
  const isRu = dict.common.copy === "Копировать";

  const parsed = useMemo(() => {
    if (!input.trim()) return null;
    try {
      const u = new URL(input.trim());
      const params: Record<string, string> = {};
      u.searchParams.forEach((v, k) => { params[k] = v; });
      return {
        protocol: u.protocol.replace(":", ""),
        host:     u.hostname,
        port:     u.port || (u.protocol === "https:" ? "443" : "80"),
        path:     u.pathname,
        query:    u.search.replace("?", ""),
        hash:     u.hash.replace("#", ""),
        origin:   u.origin,
        params,
        full:     u.href,
        isSecure: u.protocol === "https:",
      };
    } catch {
      return null;
    }
  }, [input]);

  const rows = parsed ? [
    { label: "Protocol",            value: parsed.protocol, badge: parsed.isSecure ? "secure" : "insecure" },
    { label: "Host",                value: parsed.host,     badge: null },
    { label: "Port",                value: parsed.port,     badge: null },
    { label: "Path",                value: parsed.path,     badge: null },
    { label: "Query string",        value: parsed.query || "—", badge: null },
    { label: "Fragment / Hash",     value: parsed.hash  || "—", badge: null },
    { label: "Origin",              value: parsed.origin,   badge: null },
  ] : [];

  return (
    <ToolShell onClear={() => setInput("")}>
      <div>
        <label className="input-label">{isRu ? "URL для разбора" : "URL to parse"}</label>
        <input value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false}
          placeholder="https://example.com/path?query=value#hash"
          className="code-surface w-full rounded-lg px-3 py-2.5 font-mono text-sm text-text-primary outline-none" />
      </div>

      {input && !parsed && (
        <div className="rounded-lg border border-red-800/40 bg-red-900/10 px-4 py-3 text-sm text-red-400">
          {isRu ? "Невалидный URL" : "Invalid URL"}
        </div>
      )}

      {parsed && (
        <div className="space-y-3">
          {/* Main table */}
          <div className="rounded-lg border border-border overflow-hidden">
            {rows.map(({ label, value, badge }) => (
              <div key={label} className="flex items-center gap-3 border-b border-border last:border-0 px-4 py-2.5 hover:bg-surface-hover transition-colors">
                <span className="w-36 shrink-0 text-xs text-text-muted">{label}</span>
                <span className="flex-1 font-mono text-sm text-text-primary break-all">{value}</span>
                {badge && (
                  <span className={`shrink-0 rounded border px-1.5 py-px text-[10px] font-medium ${
                    badge === "secure" ? "border-green-800/40 bg-green-900/20 text-green-400" : "border-red-800/40 bg-red-900/20 text-red-400"
                  }`}>{badge}</span>
                )}
                <CopyButton value={value === "—" ? "" : value} iconOnly />
              </div>
            ))}
          </div>

          {/* Query params */}
          {Object.keys(parsed.params).length > 0 && (
            <div>
              <label className="input-label">{isRu ? "Параметры запроса" : "Query parameters"}</label>
              <div className="rounded-lg border border-border overflow-hidden">
                {Object.entries(parsed.params).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-3 border-b border-border last:border-0 px-4 py-2 hover:bg-surface-hover transition-colors">
                    <span className="w-36 shrink-0 font-mono text-xs text-accent">{k}</span>
                    <span className="flex-1 font-mono text-sm text-text-primary">{v}</span>
                    <CopyButton value={v} iconOnly />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Encoded/Decoded */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="input-label">{isRu ? "Закодированный URL" : "Encoded URL"}</label>
              <div className="code-surface rounded-lg p-2.5 flex items-start justify-between gap-2">
                <p className="font-mono text-xs text-text-muted break-all">{encodeURI(input)}</p>
                <CopyButton value={encodeURI(input)} iconOnly />
              </div>
            </div>
            <div>
              <label className="input-label">{isRu ? "Декодированный URL" : "Decoded URL"}</label>
              <div className="code-surface rounded-lg p-2.5 flex items-start justify-between gap-2">
                <p className="font-mono text-xs text-text-primary break-all">{decodeURIComponent(input)}</p>
                <CopyButton value={decodeURIComponent(input)} iconOnly />
              </div>
            </div>
          </div>
        </div>
      )}
    </ToolShell>
  );
}
