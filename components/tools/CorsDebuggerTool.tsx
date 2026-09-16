"use client";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

// ═══════════════════════════════════════════════════════════════
// CORS rules implemented here (simplified, browser-facing subset —
// not a full re-implementation of the Fetch spec):
//  1. Access-Control-Allow-Origin must be present and either "*" or
//     match the request's origin exactly.
//  2. "*" can't be combined with a credentialed request — the server
//     must echo the exact origin instead.
//  3. A credentialed request also needs Access-Control-Allow-Credentials: true.
//  4. A non-"simple" request (method outside GET/HEAD/POST, a custom
//     header outside the safelist, or a non-form Content-Type) needs
//     a preflight — the pasted response headers are then checked for
//     Access-Control-Allow-Methods / -Headers instead of just the
//     origin/credentials rules above.
//  5. Access-Control-Allow-Origin echoing one specific origin without
//     a matching "Vary: Origin" is an info-level caching footgun, not
//     a blocker.
// ═══════════════════════════════════════════════════════════════

type Severity = "critical" | "info";

interface Finding {
  id: string;
  severity: Severity;
  message: string;
}

const SEVERITY_STYLE: Record<Severity, { color: string; bg: string; badge: string }> = {
  critical: { color: "text-red-400",  bg: "border-red-500/30 bg-red-500/5",  badge: "bg-red-500" },
  info:     { color: "text-blue-400", bg: "border-blue-500/30 bg-blue-500/5", badge: "bg-blue-500" },
};

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const;
const SIMPLE_METHODS = ["GET", "HEAD", "POST"];
const SAFELISTED_REQUEST_HEADERS = ["accept", "accept-language", "content-language"];
const SAFELISTED_CONTENT_TYPES = ["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"];

const SAMPLE_ORIGIN = "https://app.example.com";
const SAMPLE_HEADERS = `Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
Content-Type: application/json`;

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

export function CorsDebuggerTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;

  const [origin, setOrigin] = useState(SAMPLE_ORIGIN);
  const [method, setMethod] = useState<(typeof METHODS)[number]>("GET");
  const [credentials, setCredentials] = useState(true);
  const [customHeaders, setCustomHeaders] = useState("");
  const [contentType, setContentType] = useState("");
  const [responseInput, setResponseInput] = useState(SAMPLE_HEADERS);

  const customHeaderList = useMemo(
    () => customHeaders.split(",").map((h) => h.trim()).filter(Boolean),
    [customHeaders]
  );
  const nonSafelistedHeaders = useMemo(
    () => customHeaderList.filter((h) => !SAFELISTED_REQUEST_HEADERS.includes(h.toLowerCase())),
    [customHeaderList]
  );
  const contentTypeNeedsPreflight =
    contentType.trim() !== "" && !SAFELISTED_CONTENT_TYPES.includes(contentType.trim().toLowerCase());
  const methodNeedsPreflight = !SIMPLE_METHODS.includes(method);
  const needsPreflight = methodNeedsPreflight || nonSafelistedHeaders.length > 0 || contentTypeNeedsPreflight;

  const preflightReasons: string[] = [];
  if (methodNeedsPreflight) {
    preflightReasons.push(isRu ? `метод ${method} не входит в GET/HEAD/POST` : `the method ${method} isn't GET/HEAD/POST`);
  }
  if (nonSafelistedHeaders.length > 0) {
    preflightReasons.push(
      isRu
        ? `есть не-safelist заголовки: ${nonSafelistedHeaders.join(", ")}`
        : `custom header(s): ${nonSafelistedHeaders.join(", ")}`
    );
  }
  if (contentTypeNeedsPreflight) {
    preflightReasons.push(
      isRu ? `Content-Type "${contentType}" не входит в form-safe список` : `Content-Type "${contentType}" isn't one of the form-safe types`
    );
  }

  const headers = useMemo(() => parseHeaders(responseInput), [responseInput]);

  const { findings, blocked } = useMemo(() => {
    const list: Finding[] = [];
    let isBlocked = false;

    const acao = headers["access-control-allow-origin"] ?? null;
    const acac = headers["access-control-allow-credentials"] ?? null;
    const acam = headers["access-control-allow-methods"] ?? null;
    const acah = headers["access-control-allow-headers"] ?? null;
    const vary = headers["vary"] ?? null;

    const trimmedOrigin = origin.trim().toLowerCase();
    const originOk = !!acao && (acao === "*" || acao.toLowerCase() === trimmedOrigin);

    if (!acao) {
      list.push({
        id: "no-acao", severity: "critical",
        message: isRu
          ? "В ответе нет заголовка Access-Control-Allow-Origin — без него браузер блокирует ответ по умолчанию."
          : "No Access-Control-Allow-Origin header in the response — without it the browser blocks the response by default.",
      });
      isBlocked = true;
    } else if (!originOk) {
      list.push({
        id: "acao-mismatch", severity: "critical",
        message: isRu
          ? `Access-Control-Allow-Origin: "${acao}" не совпадает с origin запроса "${origin}" — браузер блокирует ответ.`
          : `Access-Control-Allow-Origin is "${acao}", which doesn't match the request's origin "${origin}" — the browser blocks the response.`,
      });
      isBlocked = true;
    }

    if (acao === "*" && credentials) {
      list.push({
        id: "wildcard-credentials", severity: "critical",
        message: isRu
          ? "Access-Control-Allow-Origin: \"*\" нельзя сочетать с credentialed-запросом — сервер должен вернуть точный origin вместо wildcard."
          : "Access-Control-Allow-Origin is \"*\" (wildcard), but the request sends credentials — a wildcard can't be combined with a credentialed request. The server must echo back the exact origin instead.",
      });
      isBlocked = true;
    } else if (originOk && credentials) {
      if (!acac || acac.toLowerCase() !== "true") {
        list.push({
          id: "missing-acac", severity: "critical",
          message: isRu
            ? "Запрос отправляет credentials, но в ответе нет Access-Control-Allow-Credentials: true — браузер блокирует доступ к ответу."
            : "The request sends credentials, but the response is missing Access-Control-Allow-Credentials: true — the browser blocks access to the response.",
        });
        isBlocked = true;
      }
    }

    if (needsPreflight) {
      if (!acam) {
        list.push({
          id: "no-acam", severity: "critical",
          message: isRu
            ? "Нужен preflight, но в ответе нет Access-Control-Allow-Methods — браузер блокирует запрос."
            : "This request needs a preflight, but Access-Control-Allow-Methods is missing from the response — the browser blocks it.",
        });
        isBlocked = true;
      } else {
        const allowed = acam.split(",").map((m) => m.trim().toUpperCase());
        if (!allowed.includes(method)) {
          list.push({
            id: "method-not-allowed", severity: "critical",
            message: isRu
              ? `Access-Control-Allow-Methods (${acam}) не включает ${method} — preflight отклоняет метод.`
              : `Access-Control-Allow-Methods (${acam}) doesn't include ${method} — the preflight rejects this method.`,
          });
          isBlocked = true;
        }
      }

      if (nonSafelistedHeaders.length > 0) {
        if (!acah) {
          list.push({
            id: "no-acah", severity: "critical",
            message: isRu
              ? "Запрос отправляет кастомные заголовки, но в ответе нет Access-Control-Allow-Headers — preflight их отклоняет."
              : "The request sends custom headers, but Access-Control-Allow-Headers is missing from the response — the preflight rejects them.",
          });
          isBlocked = true;
        } else {
          const allowedHeaders = acah.split(",").map((h) => h.trim().toLowerCase());
          const missing = nonSafelistedHeaders.filter((h) => !allowedHeaders.includes(h.toLowerCase()));
          if (missing.length > 0) {
            list.push({
              id: "headers-not-allowed", severity: "critical",
              message: isRu
                ? `Access-Control-Allow-Headers не включает: ${missing.join(", ")} — preflight отклоняет эти заголовки.`
                : `Access-Control-Allow-Headers doesn't include: ${missing.join(", ")} — the preflight rejects these headers.`,
            });
            isBlocked = true;
          }
        }
      }
    }

    if (acao && acao !== "*") {
      const varyList = vary ? vary.toLowerCase().split(",").map((v) => v.trim()) : [];
      if (!varyList.includes("origin")) {
        list.push({
          id: "missing-vary", severity: "info",
          message: isRu
            ? "Access-Control-Allow-Origin отражает конкретный origin, но заголовка Vary: Origin нет — общий кэш (CDN, прокси) может отдать этот ответ другому origin. Добавьте Vary: Origin."
            : "Access-Control-Allow-Origin echoes one specific origin without a matching Vary: Origin header — a shared cache (CDN, proxy) could serve this response to a different origin's requests. Add Vary: Origin.",
        });
      }
    }

    return { findings: list, blocked: isBlocked };
  }, [headers, origin, credentials, needsPreflight, method, nonSafelistedHeaders, isRu]);

  const summaryText = useMemo(() => {
    const lines = [
      `${isRu ? "Запрос" : "Request"}: ${method} ${origin}`,
      `${isRu ? "Вердикт" : "Verdict"}: ${blocked ? (isRu ? "ЗАБЛОКИРОВАН" : "BLOCKED") : (isRu ? "РАЗРЕШЁН" : "ALLOWED")}`,
      ...findings.map((f) => `- [${f.severity.toUpperCase()}] ${f.message}`),
    ];
    return lines.join("\n");
  }, [method, origin, blocked, findings, isRu]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Request config */}
        <div className="space-y-3">
          <div>
            <label className="input-label">{isRu ? "Origin запроса" : "Request origin"}</label>
            <input value={origin} onChange={(e) => setOrigin(e.target.value)} spellCheck={false}
              placeholder="https://app.example.com"
              className="code-surface w-full rounded-lg px-3 py-2.5 font-mono text-sm text-text-primary outline-none" />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="input-label">{isRu ? "Метод" : "Method"}</label>
              <select value={method} onChange={(e) => setMethod(e.target.value as (typeof METHODS)[number])}
                className="code-surface w-full rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none">
                {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="input-label">Content-Type</label>
              <input value={contentType} onChange={(e) => setContentType(e.target.value)} spellCheck={false}
                placeholder={isRu ? "необязательно" : "optional"}
                className="code-surface w-full rounded-lg px-3 py-2.5 font-mono text-sm text-text-primary outline-none" />
            </div>
          </div>

          <div>
            <label className="input-label">{isRu ? "Кастомные заголовки запроса" : "Custom request headers"}</label>
            <input value={customHeaders} onChange={(e) => setCustomHeaders(e.target.value)} spellCheck={false}
              placeholder={isRu ? "например: Authorization, X-Api-Key" : "e.g. Authorization, X-Api-Key"}
              className="code-surface w-full rounded-lg px-3 py-2.5 font-mono text-sm text-text-primary outline-none" />
            <p className="mt-1 text-[11px] text-text-muted">
              {isRu
                ? "Accept, Accept-Language и Content-Language можно не указывать — они не требуют preflight."
                : "No need to list Accept, Accept-Language or Content-Language — those don't trigger a preflight."}
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm text-text-primary">
            <input type="checkbox" checked={credentials} onChange={(e) => setCredentials(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-accent" />
            {isRu ? "Запрос отправляет credentials (cookies / HTTP auth)" : "Request sends credentials (cookies / HTTP auth)"}
          </label>

          {/* Preflight banner */}
          <div className={`rounded-lg border px-3 py-2.5 text-xs ${needsPreflight ? "border-amber-500/30 bg-amber-500/5 text-amber-400" : "border-border bg-surface text-text-muted"}`}>
            {needsPreflight
              ? (isRu
                  ? `Нужен preflight (OPTIONS) — ${preflightReasons.join(isRu ? " и " : " and ")}.`
                  : `Needs a preflight (OPTIONS) request — ${preflightReasons.join(" and ")}.`)
              : (isRu
                  ? "Простой запрос — preflight не требуется."
                  : "Simple request — no preflight needed.")}
          </div>
        </div>

        {/* Response headers + verdict */}
        <div className="space-y-3">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="input-label mb-0">
                {isRu
                  ? needsPreflight ? "Заголовки ответа на preflight (OPTIONS)" : "Заголовки ответа"
                  : needsPreflight ? "Preflight (OPTIONS) response headers" : "Response headers"}
              </label>
              <button onClick={() => setResponseInput(SAMPLE_HEADERS)} className="text-xs text-text-muted hover:text-text-primary transition-colors">
                {isRu ? "Пример" : "Example"}
              </button>
            </div>
            <textarea value={responseInput} onChange={(e) => setResponseInput(e.target.value)} rows={7} spellCheck={false}
              placeholder={isRu ? "Вставь заголовки из DevTools → Network → Headers..." : "Paste headers from DevTools → Network → Headers..."}
              className="code-surface w-full rounded-lg p-3 font-mono text-sm text-text-primary outline-none" />
          </div>

          {/* Verdict */}
          <div className={`rounded-xl border px-4 py-3 flex items-center justify-between ${blocked ? "border-red-500/30 bg-red-500/5" : "border-green-500/30 bg-green-500/5"}`}>
            <div>
              <p className="text-xs text-text-muted">{isRu ? "Вердикт" : "Verdict"}</p>
              <p className={`text-xl font-bold ${blocked ? "text-red-400" : "text-green-400"}`}>
                {blocked ? (isRu ? "Заблокирован" : "Blocked") : (isRu ? "Разрешён" : "Allowed")}
              </p>
            </div>
            <CopyButton value={summaryText} iconOnly />
          </div>

          {/* Findings */}
          <div className="space-y-1.5">
            {findings.length === 0 ? (
              <p className="rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-muted">
                {isRu ? "Проблем не найдено — все проверки пройдены." : "No issues found — every check passed."}
              </p>
            ) : (
              findings.map((f) => {
                const style = SEVERITY_STYLE[f.severity];
                return (
                  <div key={f.id} className={`rounded-lg border px-3 py-2 ${style.bg}`}>
                    <span className={`rounded px-1.5 py-px text-[9px] font-bold text-white ${style.badge}`}>
                      {f.severity === "critical" ? (isRu ? "Блокирует" : "Blocking") : (isRu ? "Информационный" : "Info")}
                    </span>
                    <p className={`mt-1 text-xs ${style.color}`}>{f.message}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-text-muted">
        {isRu
          ? "Примечание: это оценка по вставленным заголовкам, а не реальный сетевой запрос — CORS всё равно проверяется браузером на настоящем запросе."
          : "Note: this evaluates the headers you paste, it doesn't make a real network request — CORS is still enforced by the browser on the actual request."}
      </p>
    </div>
  );
}
