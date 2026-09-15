"use client";
import { useMemo, useRef, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";

type TypeBucket = "doc" | "script" | "style" | "image" | "font" | "xhr" | "other";

interface HarEntry {
  idx: number;
  method: string;
  url: string;
  status: number;
  startMs: number;
  timeMs: number;
  sizeBytes: number;
  mimeType: string;
  typeBucket: TypeBucket;
  failed: boolean;
}

interface Summary {
  count: number;
  totalBytes: number;
  spanMs: number;
  failedCount: number;
  slowestMs: number;
}

const TYPE_BUCKET_COLOR: Record<TypeBucket, string> = {
  doc: "#f59e0b",
  script: "#3b82f6",
  style: "#8b5cf6",
  image: "#10b981",
  font: "#ec4899",
  xhr: "#06b6d4",
  other: "#71717a",
};

const TYPE_BUCKET_LABEL: Record<TypeBucket, { en: string; ru: string }> = {
  doc: { en: "Doc", ru: "Документ" },
  script: { en: "Script", ru: "Скрипт" },
  style: { en: "Style", ru: "Стили" },
  image: { en: "Image", ru: "Картинка" },
  font: { en: "Font", ru: "Шрифт" },
  xhr: { en: "XHR/Fetch", ru: "XHR/Fetch" },
  other: { en: "Other", ru: "Другое" },
};

const SLOW_MS = 1000;

function bucketFromMime(mime: string): TypeBucket {
  const m = mime.toLowerCase();
  if (m.includes("html")) return "doc";
  if (m.includes("javascript") || m.includes("ecmascript")) return "script";
  if (m.includes("css")) return "style";
  if (m.startsWith("image/")) return "image";
  if (m.includes("font")) return "font";
  if (m.includes("json") || m.includes("xml")) return "xhr";
  return "other";
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function formatMs(n: number): string {
  if (n < 1000) return `${Math.round(n)} ms`;
  return `${(n / 1000).toFixed(2)} s`;
}

// Компактный, но структурно настоящий HAR 1.2 — пять запросов, специально
// подобранных так, чтобы показать все ветки анализа сразу: обычный
// документ, скрипт и стили, быстрый XHR, один медленный XHR (>1с — подсветится
// как медленный) и один упавший запрос картинки (404 — подсветится как ошибка).
const SAMPLE_HAR = JSON.stringify(
  {
    log: {
      version: "1.2",
      creator: { name: "Example", version: "1.0" },
      entries: [
        { startedDateTime: "2026-09-15T10:00:00.000Z", time: 120, request: { method: "GET", url: "https://example.com/" }, response: { status: 200, statusText: "OK", content: { size: 18400, mimeType: "text/html" } } },
        { startedDateTime: "2026-09-15T10:00:00.130Z", time: 340, request: { method: "GET", url: "https://example.com/assets/app.js" }, response: { status: 200, statusText: "OK", content: { size: 214000, mimeType: "application/javascript" } } },
        { startedDateTime: "2026-09-15T10:00:00.140Z", time: 90, request: { method: "GET", url: "https://example.com/assets/app.css" }, response: { status: 200, statusText: "OK", content: { size: 32000, mimeType: "text/css" } } },
        { startedDateTime: "2026-09-15T10:00:00.480Z", time: 65, request: { method: "GET", url: "https://api.example.com/v1/user" }, response: { status: 200, statusText: "OK", content: { size: 512, mimeType: "application/json" } } },
        { startedDateTime: "2026-09-15T10:00:00.560Z", time: 1850, request: { method: "GET", url: "https://api.example.com/v1/dashboard/stats" }, response: { status: 200, statusText: "OK", content: { size: 4200, mimeType: "application/json" } } },
        { startedDateTime: "2026-09-15T10:00:00.600Z", time: 40, request: { method: "GET", url: "https://example.com/img/missing-banner.png" }, response: { status: 404, statusText: "Not Found", content: { size: 512, mimeType: "text/html" } } },
      ],
    },
  },
  null,
  2
);

type SortKey = "order" | "time" | "size";
type StatusFilter = "all" | "2xx" | "3xx" | "4xx" | "5xx" | "failed";

export function HarAnalyzerTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.common.copy === "Скопировать";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");
  const [fileName, setFileName] = useState("");
  const [entries, setEntries] = useState<HarEntry[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("order");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  function reset() {
    setEntries(null);
    setSummary(null);
    setError(null);
  }

  function loadFile(file: File | null) {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => { setInput(String(reader.result ?? "")); reset(); };
    reader.onerror = () => setError(isRu ? "Не удалось прочитать файл." : "Couldn't read the file.");
    reader.readAsText(file);
  }

  function loadSample() {
    setInput(SAMPLE_HAR);
    setFileName("");
    reset();
  }

  function analyze() {
    reset();

    let parsed: unknown;
    try {
      parsed = JSON.parse(input);
    } catch {
      setError(isRu ? "Это не похоже на валидный JSON." : "This doesn't look like valid JSON.");
      return;
    }

    const rawEntries = (parsed as { log?: { entries?: unknown[] } } | null)?.log?.entries;
    if (!Array.isArray(rawEntries) || rawEntries.length === 0) {
      setError(isRu
        ? "В файле нет log.entries — это точно HAR-файл (экспорт из вкладки Network devtools)?"
        : "No log.entries found in this JSON — is it really a HAR export from the DevTools Network tab?");
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = rawEntries as any[];
      const starts = raw.map((e) => {
        const t = new Date(e?.startedDateTime).getTime();
        return Number.isFinite(t) ? t : 0;
      });
      const firstStart = Math.min(...starts);

      const list: HarEntry[] = raw.map((e, i) => {
        const status = Number(e?.response?.status ?? 0);
        const mime = String(e?.response?.content?.mimeType ?? "");
        const sizeBytes = Math.max(0, Number(e?.response?.content?.size ?? e?.response?.bodySize ?? 0));
        const timeMs = Math.max(0, Number(e?.time ?? 0));
        return {
          idx: i,
          method: String(e?.request?.method ?? "GET").toUpperCase(),
          url: String(e?.request?.url ?? ""),
          status,
          startMs: starts[i] - firstStart,
          timeMs,
          sizeBytes,
          mimeType: mime,
          typeBucket: bucketFromMime(mime),
          failed: status === 0 || status >= 400,
        };
      });

      const totalBytes = list.reduce((s, e) => s + e.sizeBytes, 0);
      const spanMs = Math.max(1, ...list.map((e) => e.startMs + e.timeMs));
      const failedCount = list.filter((e) => e.failed).length;
      const slowestMs = Math.max(...list.map((e) => e.timeMs));

      setEntries(list);
      setSummary({ count: list.length, totalBytes, spanMs, failedCount, slowestMs });
    } catch {
      setError(isRu ? "Не удалось разобрать записи HAR — часть данных повреждена." : "Couldn't parse the HAR entries — some data looks malformed.");
    }
  }

  const filtered = useMemo(() => {
    if (!entries) return [];
    let list = entries;
    if (statusFilter !== "all") {
      list = list.filter((e) => (statusFilter === "failed" ? e.failed : Math.floor(e.status / 100) === Number(statusFilter[0])));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((e) => e.url.toLowerCase().includes(q));
    }
    const sorted = [...list];
    if (sortKey === "time") sorted.sort((a, b) => b.timeMs - a.timeMs);
    else if (sortKey === "size") sorted.sort((a, b) => b.sizeBytes - a.sizeBytes);
    else sorted.sort((a, b) => a.idx - b.idx);
    return sorted;
  }, [entries, statusFilter, search, sortKey]);

  function statusColorClass(status: number, failed: boolean): string {
    if (failed) return "text-red-400";
    if (status >= 300) return "text-blue-400";
    return "text-emerald-400";
  }

  const SORT_OPTIONS: { key: SortKey; en: string; ru: string }[] = [
    { key: "order", en: "Order", ru: "По порядку" },
    { key: "time", en: "Slowest first", ru: "Сначала медленные" },
    { key: "size", en: "Largest first", ru: "Сначала большие" },
  ];
  const STATUS_OPTIONS: { key: StatusFilter; label: string }[] = [
    { key: "all", label: isRu ? "Все" : "All" },
    { key: "2xx", label: "2xx" },
    { key: "3xx", label: "3xx" },
    { key: "4xx", label: "4xx" },
    { key: "5xx", label: "5xx" },
    { key: "failed", label: isRu ? "Ошибки" : "Failed" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <label className="input-label mb-0">{isRu ? "HAR-файл (JSON)" : "HAR file (JSON)"}</label>
          <div className="flex items-center gap-3">
            <button onClick={() => fileInputRef.current?.click()}
              className="text-xs text-text-muted hover:text-text-primary transition-colors">
              {isRu ? "Загрузить .har" : "Upload .har"}
            </button>
            <button onClick={loadSample} className="text-xs text-text-muted hover:text-text-primary transition-colors">
              {isRu ? "Пример" : "Example"}
            </button>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept=".har,application/json"
          className="hidden" onChange={(e) => loadFile(e.target.files?.[0] ?? null)} />
        <textarea value={input} onChange={(e) => { setInput(e.target.value); reset(); }} rows={8} spellCheck={false}
          placeholder={isRu
            ? "Вставьте содержимое .har-файла (экспорт вкладки Network в devtools: правый клик по списку запросов -> Save all as HAR)..."
            : "Paste the contents of a .har file (DevTools Network tab: right-click the request list -> Save all as HAR)..."}
          className="code-surface w-full rounded-lg p-3 font-mono text-xs text-text-primary outline-none" />
        <p className="mt-1 text-[11px] text-text-muted">
          {fileName ? `${fileName} — ` : ""}
          {isRu
            ? "Разбор происходит полностью в браузере — файл никуда не отправляется."
            : "Parsing happens entirely in your browser — the file is never uploaded anywhere."}
        </p>
      </div>

      <button onClick={analyze} disabled={!input.trim()}
        className="rounded bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg hover:bg-amber-400 transition-colors disabled:opacity-50">
        {isRu ? "Анализировать" : "Analyze"}
      </button>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {summary && entries && (
        <div className="space-y-4">
          {/* Сводка */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[
              { label: isRu ? "Запросов" : "Requests", value: String(summary.count) },
              { label: isRu ? "Суммарный размер" : "Total size", value: formatBytes(summary.totalBytes) },
              { label: isRu ? "Общее время" : "Total span", value: formatMs(summary.spanMs) },
              { label: isRu ? "Самый медленный" : "Slowest", value: formatMs(summary.slowestMs) },
              { label: isRu ? "Ошибки" : "Failed", value: String(summary.failedCount) },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-border bg-surface px-3 py-2">
                <div className={`font-mono text-sm ${s.label === (isRu ? "Ошибки" : "Failed") && summary.failedCount > 0 ? "text-red-400" : "text-text-primary"}`}>
                  {s.value}
                </div>
                <div className="text-[10px] text-text-muted">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Waterfall */}
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <label className="input-label mb-0">{isRu ? "Таймлайн запросов" : "Request waterfall"}</label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(TYPE_BUCKET_COLOR) as TypeBucket[]).map((b) => (
                  <span key={b} className="flex items-center gap-1 text-[10px] text-text-muted">
                    <span className="h-2 w-2 rounded-sm" style={{ background: TYPE_BUCKET_COLOR[b] }} />
                    {isRu ? TYPE_BUCKET_LABEL[b].ru : TYPE_BUCKET_LABEL[b].en}
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-[3px] rounded-lg border border-border bg-canvas p-2">
              {entries.map((e) => {
                const leftPct = (e.startMs / summary.spanMs) * 100;
                const widthPct = Math.max((e.timeMs / summary.spanMs) * 100, 0.4);
                return (
                  <div key={e.idx} className="relative flex items-center gap-2">
                    <span className="w-6 shrink-0 text-right font-mono text-[10px] text-text-disabled">{e.idx + 1}</span>
                    <div className="relative h-3.5 flex-1 overflow-hidden rounded-sm bg-surface">
                      <div
                        title={`${e.method} ${e.url} — ${formatMs(e.timeMs)}`}
                        className={`absolute top-0 h-full rounded-sm ${e.failed ? "ring-1 ring-red-500" : ""}`}
                        style={{ left: `${leftPct}%`, width: `${widthPct}%`, background: TYPE_BUCKET_COLOR[e.typeBucket] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Таблица */}
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder={isRu ? "Фильтр по URL..." : "Filter by URL..."}
                className="code-surface min-w-0 flex-1 rounded-lg px-3 py-1.5 text-xs text-text-primary outline-none" />
              <div className="flex overflow-hidden rounded border border-border">
                {STATUS_OPTIONS.map((o) => (
                  <button key={o.key} onClick={() => setStatusFilter(o.key)}
                    className={`px-2 py-1.5 text-xs transition-colors ${statusFilter === o.key ? "bg-accent text-accent-fg" : "bg-surface text-text-muted hover:bg-surface-hover"}`}>
                    {o.label}
                  </button>
                ))}
              </div>
              <div className="flex overflow-hidden rounded border border-border">
                {SORT_OPTIONS.map((o) => (
                  <button key={o.key} onClick={() => setSortKey(o.key)}
                    className={`px-2 py-1.5 text-xs transition-colors ${sortKey === o.key ? "bg-accent text-accent-fg" : "bg-surface text-text-muted hover:bg-surface-hover"}`}>
                    {isRu ? o.ru : o.en}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="text-left text-xs text-text-muted">
                    <th className="py-1.5 pr-2 font-normal">#</th>
                    <th className="py-1.5 pr-2 font-normal">{isRu ? "Метод" : "Method"}</th>
                    <th className="py-1.5 pr-2 font-normal">URL</th>
                    <th className="py-1.5 pr-2 font-normal">{isRu ? "Статус" : "Status"}</th>
                    <th className="py-1.5 pr-2 font-normal">{isRu ? "Тип" : "Type"}</th>
                    <th className="py-1.5 pr-2 font-normal">{isRu ? "Размер" : "Size"}</th>
                    <th className="py-1.5 font-normal">{isRu ? "Время" : "Time"}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => {
                    const slow = e.timeMs > SLOW_MS;
                    return (
                      <tr key={e.idx} className={`border-t border-border/60 ${e.failed ? "bg-red-500/5" : slow ? "bg-amber-500/5" : ""}`}>
                        <td className="py-1.5 pr-2 font-mono text-[11px] text-text-disabled">{e.idx + 1}</td>
                        <td className="py-1.5 pr-2 font-mono text-[11px] text-text-secondary">{e.method}</td>
                        <td className="max-w-[280px] truncate py-1.5 pr-2 font-mono text-[11px] text-text-primary" title={e.url}>{e.url}</td>
                        <td className={`py-1.5 pr-2 font-mono text-[11px] ${statusColorClass(e.status, e.failed)}`}>{e.status || (isRu ? "нет ответа" : "no response")}</td>
                        <td className="py-1.5 pr-2 text-[11px]" style={{ color: TYPE_BUCKET_COLOR[e.typeBucket] }}>
                          {isRu ? TYPE_BUCKET_LABEL[e.typeBucket].ru : TYPE_BUCKET_LABEL[e.typeBucket].en}
                        </td>
                        <td className="py-1.5 pr-2 font-mono text-[11px] text-text-muted">{formatBytes(e.sizeBytes)}</td>
                        <td className={`py-1.5 font-mono text-[11px] ${slow ? "text-amber-400" : "text-text-muted"}`}>{formatMs(e.timeMs)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <p className="py-3 text-center text-xs text-text-muted">{isRu ? "Ничего не найдено." : "No matching requests."}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
