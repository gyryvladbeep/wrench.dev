"use client";
import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";

const CODES = [
  // 1xx
  { code:100, name:"Continue",            category:"1xx", desc:"The server received the request headers and the client should proceed." },
  { code:101, name:"Switching Protocols", category:"1xx", desc:"The server agrees to switch protocols as requested." },
  // 2xx
  { code:200, name:"OK",                  category:"2xx", desc:"Standard success response." },
  { code:201, name:"Created",             category:"2xx", desc:"Resource created. URI of the new resource is returned in Location header." },
  { code:202, name:"Accepted",            category:"2xx", desc:"Request accepted for processing, but processing not completed." },
  { code:204, name:"No Content",          category:"2xx", desc:"Success, but no response body. Common for DELETE." },
  { code:206, name:"Partial Content",     category:"2xx", desc:"Partial GET request fulfilled. Used for file downloads and streaming." },
  // 3xx
  { code:301, name:"Moved Permanently",   category:"3xx", desc:"Resource moved permanently. Update bookmarks. Search engines transfer link equity." },
  { code:302, name:"Found",               category:"3xx", desc:"Temporary redirect. Browser follows but does not update bookmarks." },
  { code:304, name:"Not Modified",        category:"3xx", desc:"Cached version is fresh. No body returned. Used with ETag/Last-Modified." },
  { code:307, name:"Temporary Redirect",  category:"3xx", desc:"Same as 302 but method must not change (POST stays POST)." },
  { code:308, name:"Permanent Redirect",  category:"3xx", desc:"Same as 301 but method must not change." },
  // 4xx
  { code:400, name:"Bad Request",         category:"4xx", desc:"Server cannot process due to malformed syntax, invalid parameters, or validation errors." },
  { code:401, name:"Unauthorized",        category:"4xx", desc:"Authentication required. Despite the name, this means unauthenticated." },
  { code:403, name:"Forbidden",           category:"4xx", desc:"Authenticated but not authorized. Server understood but refuses." },
  { code:404, name:"Not Found",           category:"4xx", desc:"Resource not found at this URI. May also be used to hide 403." },
  { code:405, name:"Method Not Allowed",  category:"4xx", desc:"HTTP method not supported for this resource. Response includes Allow header." },
  { code:408, name:"Request Timeout",     category:"4xx", desc:"Server timed out waiting for the request." },
  { code:409, name:"Conflict",            category:"4xx", desc:"Request conflicts with current state of the server. Common with optimistic locking." },
  { code:410, name:"Gone",                category:"4xx", desc:"Resource permanently removed. Unlike 404, clients should not retry." },
  { code:413, name:"Payload Too Large",   category:"4xx", desc:"Request body exceeds server limit." },
  { code:415, name:"Unsupported Media Type", category:"4xx", desc:"Content-Type not supported by the server." },
  { code:422, name:"Unprocessable Entity",category:"4xx", desc:"Semantically invalid request. Common for validation errors in REST APIs." },
  { code:429, name:"Too Many Requests",   category:"4xx", desc:"Rate limit exceeded. Response often includes Retry-After header." },
  // 5xx
  { code:500, name:"Internal Server Error",category:"5xx",desc:"Generic server error. Check server logs." },
  { code:501, name:"Not Implemented",     category:"5xx", desc:"Server does not support the functionality required." },
  { code:502, name:"Bad Gateway",         category:"5xx", desc:"Upstream server returned invalid response. Common with proxies and load balancers." },
  { code:503, name:"Service Unavailable", category:"5xx", desc:"Server temporarily unable to handle requests. Often with Retry-After header." },
  { code:504, name:"Gateway Timeout",     category:"5xx", desc:"Upstream server did not respond in time." },
];

const CAT_COLORS: Record<string, string> = {
  "1xx": "text-text-muted border-border bg-surface",
  "2xx": "text-success border-green-800/40 bg-green-900/20",
  "3xx": "text-blue-400 border-blue-800/40 bg-blue-900/20",
  "4xx": "text-amber-400 border-amber-800/40 bg-amber-900/20",
  "5xx": "text-red-400 border-red-800/40 bg-red-900/20",
};

export function HttpStatusCodesTool({ dict }: { dict: Dictionary }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const isRu = dict.common.copy === "Копировать";

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return CODES.filter((c) => {
      const matchFilter = filter === "all" || c.category === filter;
      const matchSearch = !q || String(c.code).includes(q) || c.name.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });
  }, [search, filter]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={isRu ? "Поиск по коду или названию…" : "Search by code or name…"}
          className="code-surface flex-1 min-w-[200px] rounded-lg px-3 py-2 text-sm text-text-primary outline-none" />
        <div className="flex gap-1">
          {["all","1xx","2xx","3xx","4xx","5xx"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded px-2.5 py-1.5 text-xs transition-colors ${filter === f ? "bg-accent text-accent-fg" : "bg-surface border border-border text-text-muted hover:bg-surface-hover"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-1">
        {filtered.map((c) => (
          <div key={c.code} className="flex items-start gap-3 rounded-md border border-border bg-surface p-3 hover:bg-surface-hover transition-colors">
            <div className="flex items-center gap-2 shrink-0">
              <span className={`rounded border px-2 py-0.5 font-mono text-sm font-bold ${CAT_COLORS[c.category]}`}>
                {c.code}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary">{c.name}</p>
              <p className="mt-0.5 text-xs text-text-muted leading-relaxed">{c.desc}</p>
            </div>
            <span className="shrink-0 text-[10px] text-text-disabled uppercase">{c.category}</span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-8 text-center text-sm text-text-muted">
            {isRu ? "Ничего не найдено" : "No results found"}
          </div>
        )}
      </div>
      <p className="text-xs text-text-muted">{filtered.length} / {CODES.length} {isRu ? "кодов" : "codes"}</p>
    </div>
  );
}
