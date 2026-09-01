"use client";
import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";

interface HeaderCheck {
  header:       string;
  label:        string;
  labelRu:      string;
  severity:     "critical" | "high" | "medium" | "info";
  description:  string;
  descriptionRu:string;
  goodExample:  string;
  badExample?:  string;
  check:        (value: string | null) => { pass: boolean; note?: string; noteRu?: string };
}

const CHECKS: HeaderCheck[] = [
  {
    header: "content-security-policy",
    label: "Content-Security-Policy", labelRu: "Content-Security-Policy",
    severity: "critical",
    description: "Prevents XSS attacks by controlling which resources the browser can load.",
    descriptionRu: "Предотвращает XSS атаки, контролируя какие ресурсы браузер может загружать.",
    goodExample: "default-src 'self'; script-src 'self' https://cdn.example.com",
    check: (v) => {
      if (!v) return { pass: false, note: "Missing — high XSS risk", noteRu: "Отсутствует — высокий риск XSS" };
      if (v.includes("unsafe-inline")) return { pass: false, note: "'unsafe-inline' weakens CSP", noteRu: "'unsafe-inline' ослабляет CSP" };
      if (v.includes("unsafe-eval"))   return { pass: false, note: "'unsafe-eval' weakens CSP",   noteRu: "'unsafe-eval' ослабляет CSP"  };
      if (v.includes("*"))             return { pass: false, note: "Wildcard '*' is too permissive", noteRu: "Wildcard '*' слишком разрешительный" };
      return { pass: true };
    },
  },
  {
    header: "strict-transport-security",
    label: "Strict-Transport-Security (HSTS)", labelRu: "Strict-Transport-Security (HSTS)",
    severity: "critical",
    description: "Forces browsers to use HTTPS, preventing protocol downgrade attacks.",
    descriptionRu: "Принуждает браузеры использовать HTTPS, предотвращая атаки понижения протокола.",
    goodExample: "max-age=31536000; includeSubDomains; preload",
    check: (v) => {
      if (!v) return { pass: false, note: "Missing — site vulnerable to downgrade attacks", noteRu: "Отсутствует — сайт уязвим к атакам понижения" };
      const maxAge = parseInt(v.match(/max-age=(\d+)/i)?.[1] ?? "0");
      if (maxAge < 86400)    return { pass: false, note: "max-age too short (< 1 day)", noteRu: "max-age слишком короткий (< 1 дня)" };
      if (maxAge < 15552000) return { pass: true,  note: "max-age < 6 months (recommended: 1 year)", noteRu: "max-age < 6 месяцев (рекомендуется: 1 год)" };
      return { pass: true };
    },
  },
  {
    header: "x-content-type-options",
    label: "X-Content-Type-Options", labelRu: "X-Content-Type-Options",
    severity: "high",
    description: "Prevents MIME-type sniffing attacks.",
    descriptionRu: "Предотвращает атаки угадывания MIME-типа.",
    goodExample: "nosniff",
    check: (v) => {
      if (!v) return { pass: false, note: "Missing — MIME sniffing possible", noteRu: "Отсутствует — возможно MIME угадывание" };
      if (v.toLowerCase() !== "nosniff") return { pass: false, note: `Invalid value: ${v} (expected: nosniff)`, noteRu: `Неверное значение (ожидается: nosniff)` };
      return { pass: true };
    },
  },
  {
    header: "x-frame-options",
    label: "X-Frame-Options", labelRu: "X-Frame-Options",
    severity: "high",
    description: "Prevents clickjacking by controlling if site can be embedded in iframes.",
    descriptionRu: "Предотвращает clickjacking — контролирует встраивание в iframe.",
    goodExample: "DENY or SAMEORIGIN",
    check: (v) => {
      if (!v) return { pass: false, note: "Missing — clickjacking possible", noteRu: "Отсутствует — возможен clickjacking" };
      const val = v.toUpperCase();
      if (!["DENY","SAMEORIGIN"].includes(val) && !val.startsWith("ALLOW-FROM"))
        return { pass: false, note: `Invalid value: ${v}`, noteRu: `Неверное значение: ${v}` };
      return { pass: true };
    },
  },
  {
    header: "permissions-policy",
    label: "Permissions-Policy", labelRu: "Permissions-Policy",
    severity: "medium",
    description: "Controls which browser features and APIs can be used (camera, mic, geolocation).",
    descriptionRu: "Контролирует доступ к функциям браузера (камера, микрофон, геолокация).",
    goodExample: "camera=(), microphone=(), geolocation=()",
    check: (v) => {
      if (!v) return { pass: false, note: "Missing — browser features unrestricted", noteRu: "Отсутствует — функции браузера не ограничены" };
      return { pass: true };
    },
  },
  {
    header: "referrer-policy",
    label: "Referrer-Policy", labelRu: "Referrer-Policy",
    severity: "medium",
    description: "Controls how much referrer info is sent with requests.",
    descriptionRu: "Контролирует сколько информации о реферере передаётся с запросами.",
    goodExample: "strict-origin-when-cross-origin",
    check: (v) => {
      if (!v) return { pass: false, note: "Missing — full referrer URL may be leaked", noteRu: "Отсутствует — URL реферера может утекать" };
      const unsafe = ["unsafe-url","no-referrer-when-downgrade"];
      if (unsafe.includes(v.toLowerCase())) return { pass: false, note: `Unsafe value: ${v}`, noteRu: `Небезопасное значение: ${v}` };
      return { pass: true };
    },
  },
  {
    header: "x-xss-protection",
    label: "X-XSS-Protection", labelRu: "X-XSS-Protection",
    severity: "info",
    description: "Legacy XSS filter for older browsers (CSP is preferred).",
    descriptionRu: "Устаревший XSS фильтр для старых браузеров (CSP предпочтительнее).",
    goodExample: "1; mode=block OR 0 (if CSP is set)",
    check: (v) => {
      if (!v) return { pass: false, note: "Missing — legacy browsers unprotected", noteRu: "Отсутствует — старые браузеры не защищены" };
      return { pass: true };
    },
  },
  {
    header: "cache-control",
    label: "Cache-Control", labelRu: "Cache-Control",
    severity: "info",
    description: "Controls caching of sensitive pages.",
    descriptionRu: "Контролирует кэширование чувствительных страниц.",
    goodExample: "no-store, no-cache (for sensitive pages)",
    check: (v) => {
      if (!v) return { pass: false, note: "Missing — responses may be cached", noteRu: "Отсутствует — ответы могут кэшироваться" };
      return { pass: true };
    },
  },
  {
    header: "access-control-allow-origin",
    label: "CORS (Access-Control-Allow-Origin)", labelRu: "CORS (Access-Control-Allow-Origin)",
    severity: "critical",
    description: "Controls cross-origin resource sharing.",
    descriptionRu: "Контролирует совместное использование ресурсов между источниками.",
    goodExample: "https://yourdomain.com (specific origin, not *)",
    check: (v) => {
      if (!v) return { pass: true, note: "Not set (OK for non-API endpoints)", noteRu: "Не установлен (ОК для не-API)" };
      if (v === "*") return { pass: false, note: "Wildcard '*' allows any origin — dangerous for auth APIs", noteRu: "Wildcard '*' разрешает любой источник — опасно для auth API" };
      return { pass: true };
    },
  },
  {
    header: "server",
    label: "Server", labelRu: "Server",
    severity: "info",
    description: "Server header reveals technology stack — should be removed or generic.",
    descriptionRu: "Заголовок Server раскрывает стек технологий — нужно убрать или сделать общим.",
    goodExample: 'Should be absent or generic (e.g. "webserver")',
    check: (v) => {
      if (!v) return { pass: true, note: "Not exposed (good)", noteRu: "Не раскрыт (хорошо)" };
      const risky = ["apache","nginx","iis","express","php","tomcat","jetty"];
      const lower = v.toLowerCase();
      if (risky.some(r => lower.includes(r))) return { pass: false, note: `Reveals: ${v}`, noteRu: `Раскрывает: ${v}` };
      return { pass: true };
    },
  },
  {
    header: "x-powered-by",
    label: "X-Powered-By", labelRu: "X-Powered-By",
    severity: "info",
    description: "Reveals server technology — should be removed.",
    descriptionRu: "Раскрывает технологию сервера — нужно убрать.",
    goodExample: "Should be absent",
    check: (v) => {
      if (!v) return { pass: true, note: "Not exposed (good)", noteRu: "Не раскрыт (хорошо)" };
      return { pass: false, note: `Reveals: ${v} — remove this header`, noteRu: `Раскрывает: ${v} — уберите заголовок` };
    },
  },
];

function parseHeaders(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const val = line.slice(idx + 1).trim();
    if (key) result[key] = val;
  }
  return result;
}

const SEVERITY_META = {
  critical: { label:"Critical", labelRu:"Критичный",       color:"text-red-400",    bg:"border-red-500/30 bg-red-500/5",       badge:"bg-red-500" },
  high:     { label:"High",     labelRu:"Высокий",          color:"text-orange-400", bg:"border-orange-500/30 bg-orange-500/5", badge:"bg-orange-500" },
  medium:   { label:"Medium",   labelRu:"Средний",          color:"text-amber-400",  bg:"border-amber-500/30 bg-amber-500/5",   badge:"bg-amber-500" },
  info:     { label:"Info",     labelRu:"Информационный",   color:"text-blue-400",   bg:"border-blue-500/30 bg-blue-500/5",     badge:"bg-blue-500" },
};

const SAMPLE = `HTTP/1.1 200 OK
Content-Type: application/json
Server: nginx/1.18.0
X-Powered-By: Express
Access-Control-Allow-Origin: *
Cache-Control: no-cache`;

export function HttpSecurityHeadersTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.common.copy === "Копировать";
  const [input,    setInput]    = useState(SAMPLE);
  const [filter,   setFilter]   = useState<"all"|"fail"|"pass">("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const headers = useMemo(() => parseHeaders(input), [input]);

  const results = useMemo(() => CHECKS.map(check => {
    const value  = headers[check.header] ?? null;
    const result = check.check(value);
    return { ...check, value, ...result };
  }), [headers]);

  const failed  = results.filter(r => !r.pass);
  const passed  = results.filter(r => r.pass);
  const score   = Math.round((passed.length / results.length) * 100);

  const criticalFails = failed.filter(r => r.severity === "critical").length;
  const highFails     = failed.filter(r => r.severity === "high").length;

  const filtered = results.filter(r =>
    filter === "all" ? true : filter === "fail" ? !r.pass : r.pass
  );

  function toggleExpand(h: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(h) ? next.delete(h) : next.add(h);
      return next;
    });
  }

  const scoreColor = score >= 80 ? "text-success" : score >= 50 ? "text-amber-400" : "text-error";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-lg border border-border bg-surface/50 p-4 flex items-start gap-3">
        <span className="text-2xl">🛡️</span>
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            {isRu ? "Проверка безопасности HTTP заголовков" : "HTTP Security Headers Checker"}
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            {isRu
              ? "Вставь HTTP заголовки ответа сервера — инструмент проверит их на соответствие лучшим практикам безопасности."
              : "Paste your HTTP response headers — the tool will analyze them against security best practices."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Input */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="input-label">{isRu ? "HTTP заголовки ответа" : "HTTP Response Headers"}</label>
              <button onClick={() => setInput(SAMPLE)} className="text-xs text-text-muted hover:text-text-primary transition-colors">
                {isRu ? "Пример" : "Example"}
              </button>
            </div>
            <textarea value={input} onChange={e => setInput(e.target.value)} rows={16} spellCheck={false}
              placeholder={isRu ? "Вставь заголовки из DevTools → Network → Headers..." : "Paste headers from DevTools → Network → Headers..."}
              className="code-surface w-full rounded-lg p-3 font-mono text-sm text-text-primary outline-none" />
          </div>
          <div className="rounded-lg border border-border bg-surface p-3 text-xs text-text-muted">
            <p className="font-medium text-text-primary mb-1">{isRu ? "Где взять заголовки?" : "Where to get headers?"}</p>
            <ol className="space-y-1 list-none">
              <li>1. {isRu ? "Открой DevTools (F12)" : "Open DevTools (F12)"}</li>
              <li>2. {isRu ? "Вкладка Network" : "Go to Network tab"}</li>
              <li>3. {isRu ? "Обнови страницу, нажми на первый запрос" : "Refresh, click the first request"}</li>
              <li>4. {isRu ? "Вкладка Headers → Response Headers" : "Headers tab → Response Headers"}</li>
              <li>5. {isRu ? "Скопируй и вставь сюда" : "Copy and paste here"}</li>
            </ol>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {/* Score */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-text-muted">{isRu ? "Оценка безопасности" : "Security Score"}</p>
                <p className={`text-4xl font-black ${scoreColor}`}>{score}<span className="text-xl">%</span></p>
              </div>
              <div className="text-right space-y-1">
                {criticalFails > 0 && <p className="text-xs text-red-400">{criticalFails} {isRu ? "критичных" : "critical"}</p>}
                {highFails > 0     && <p className="text-xs text-orange-400">{highFails} {isRu ? "высоких" : "high"}</p>}
                <p className="text-xs text-success">{passed.length}/{results.length} {isRu ? "пройдено" : "passed"}</p>
              </div>
            </div>
            {/* Score bar */}
            <div className="h-2 w-full rounded-full bg-canvas overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width:`${score}%`, background: score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444" }} />
            </div>
            <p className="mt-2 text-xs text-text-muted">
              {score >= 80 ? (isRu ? "Хорошая конфигурация безопасности" : "Good security configuration") :
               score >= 50 ? (isRu ? "Требует улучшений" : "Needs improvement") :
               (isRu ? "Серьёзные проблемы безопасности" : "Serious security issues")}
            </p>
          </div>

          {/* Filter */}
          <div className="flex gap-1 rounded border border-border overflow-hidden w-fit">
            {(["all","fail","pass"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs transition-colors ${filter === f ? "bg-accent text-accent-fg font-medium" : "bg-surface text-text-muted hover:bg-surface-hover"}`}>
                {f === "all"  ? (isRu ? `Все (${results.length})` : `All (${results.length})`) :
                 f === "fail" ? (isRu ? `Проблемы (${failed.length})` : `Issues (${failed.length})`) :
                 (isRu ? `ОК (${passed.length})` : `OK (${passed.length})`)}
              </button>
            ))}
          </div>

          {/* Checks list */}
          <div className="space-y-2 max-h-[480px] overflow-y-auto">
            {filtered.map(r => {
              const sev  = SEVERITY_META[r.severity];
              const isEx = expanded.has(r.header);
              return (
                <div key={r.header} className={`rounded-lg border overflow-hidden transition-colors ${r.pass ? "border-border bg-surface" : sev.bg}`}>
                  <button onClick={() => toggleExpand(r.header)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-hover transition-colors">
                    <span className={`shrink-0 text-sm font-bold ${r.pass ? "text-success" : sev.color}`}>
                      {r.pass ? "✓" : "✕"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-text-primary truncate">{r.label}</span>
                        <span className={`rounded px-1.5 py-px text-[9px] font-bold text-white ${sev.badge}`}>
                          {isRu ? sev.labelRu : sev.label}
                        </span>
                      </div>
                      {(r.note || r.noteRu) && (
                        <p className={`text-[10px] mt-0.5 ${r.pass ? "text-text-muted" : sev.color}`}>
                          {isRu ? (r.noteRu ?? r.note) : r.note}
                        </p>
                      )}
                    </div>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className={`shrink-0 text-text-muted transition-transform ${isEx ? "rotate-180" : ""}`}>
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>

                  {isEx && (
                    <div className="border-t border-border px-3 pb-3 pt-2.5 space-y-2">
                      <p className="text-xs text-text-muted leading-relaxed">
                        {isRu ? r.descriptionRu : r.description}
                      </p>
                      <div className="rounded border border-border bg-canvas px-3 py-2">
                        <p className="text-[10px] text-text-muted mb-1">{isRu ? "Рекомендуемое значение:" : "Recommended:"}</p>
                        <code className="font-mono text-xs text-success">{r.goodExample}</code>
                      </div>
                      {r.value && (
                        <div className="rounded border border-border bg-canvas px-3 py-2">
                          <p className="text-[10px] text-text-muted mb-1">{isRu ? "Текущее значение:" : "Current value:"}</p>
                          <code className={`font-mono text-xs ${r.pass ? "text-text-primary" : sev.color}`}>{r.value}</code>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}