"use client";
import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

interface ValidationIssue {
  path:     string;
  type:     "missing" | "extra" | "wrong_type" | "null" | "format" | "empty";
  expected: string;
  actual:   string;
  severity: "error" | "warning" | "info";
}

function detectType(val: JsonValue): string {
  if (val === null) return "null";
  if (Array.isArray(val)) return "array";
  return typeof val;
}

function validate(schema: JsonValue, response: JsonValue, path = "$", issues: ValidationIssue[] = []): ValidationIssue[] {
  if (typeof schema === "object" && schema !== null && !Array.isArray(schema)) {
    const s = schema as Record<string, JsonValue>;
    const r = (typeof response === "object" && response !== null && !Array.isArray(response))
      ? response as Record<string, JsonValue> : null;

    if (!r) {
      issues.push({ path, type:"wrong_type", expected:"object", actual:detectType(response), severity:"error" });
      return issues;
    }

    for (const [key, sv] of Object.entries(s)) {
      const p = `${path}.${key}`;
      if (!(key in r)) {
        issues.push({ path:p, type:"missing", expected:detectType(sv), actual:"undefined", severity:"error" });
        continue;
      }
      const rv = r[key];
      if (rv === null) {
        issues.push({ path:p, type:"null", expected:detectType(sv), actual:"null", severity:"warning" });
        continue;
      }
      validate(sv, rv, p, issues);
    }

    for (const key of Object.keys(r)) {
      if (!(key in s)) {
        issues.push({ path:`${path}.${key}`, type:"extra", expected:"not present", actual:detectType(r[key]), severity:"info" });
      }
    }
    return issues;
  }

  if (Array.isArray(schema)) {
    if (!Array.isArray(response)) {
      issues.push({ path, type:"wrong_type", expected:"array", actual:detectType(response), severity:"error" });
      return issues;
    }
    if (response.length === 0) {
      issues.push({ path, type:"empty", expected:"non-empty array", actual:"[]", severity:"warning" });
      return issues;
    }
    if (schema.length > 0 && response.length > 0) validate(schema[0], response[0], `${path}[0]`, issues);
    return issues;
  }

  const st = typeof schema, rt = detectType(response);
  if (st !== rt) {
    issues.push({ path, type:"wrong_type", expected:st, actual:rt, severity:"error" });
  }
  if (st === "string" && rt === "string") {
    const sv = schema as string, rv = response as string;
    if (sv.includes("@") && !rv.includes("@")) issues.push({ path, type:"format", expected:"email format", actual:rv.slice(0,20), severity:"warning" });
    if (/^\d{4}-\d{2}-\d{2}/.test(sv) && !/^\d{4}-\d{2}-\d{2}/.test(rv)) issues.push({ path, type:"format", expected:"date (YYYY-MM-DD)", actual:rv.slice(0,20), severity:"warning" });
    if (rv.trim() === "") issues.push({ path, type:"empty", expected:"non-empty string", actual:"empty", severity:"warning" });
  }
  return issues;
}

const PRESETS = [
  {
    label:"User API",
    schema:`{"id":1,"name":"string","email":"user@example.com","role":"admin","active":true,"created_at":"2024-01-01","address":{"city":"string","zip":"string"}}`,
    response:`{"id":123,"name":"Alice","email":"alice@example.com","active":true,"created_at":"2024-03-15","address":{"city":"Yerevan"},"extra_field":"unexpected"}`,
  },
  {
    label:"Orders API",
    schema:`{"order_id":1,"status":"pending","total":0.00,"items":[{"product_id":1,"quantity":1,"price":0.00}],"created_at":"2024-01-01"}`,
    response:`{"order_id":"ORD-456","status":"shipped","total":99.99,"items":[],"created_at":"2024-08-20"}`,
  },
];

const SEV = {
  error:   { icon:"✕", color:"text-red-400",   bg:"border-red-500/30 bg-red-500/5",     label:"Error",   labelRu:"Ошибка" },
  warning: { icon:"⚠", color:"text-amber-400", bg:"border-amber-500/30 bg-amber-500/5", label:"Warning", labelRu:"Предупреждение" },
  info:    { icon:"ℹ", color:"text-blue-400",  bg:"border-blue-500/30 bg-blue-500/5",   label:"Info",    labelRu:"Инфо" },
};

const TYPE_LABELS: Record<string, [string, string]> = {
  missing:    ["Missing field",   "Отсутствует поле"],
  extra:      ["Extra field",     "Лишнее поле"],
  wrong_type: ["Wrong type",      "Неверный тип"],
  null:       ["Null value",      "Null значение"],
  format:     ["Format mismatch", "Неверный формат"],
  empty:      ["Empty value",     "Пустое значение"],
};

export function ApiResponseValidatorTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.common.copy === "Копировать";
  const [schema,   setSchema]   = useState(PRESETS[0].schema);
  const [response, setResponse] = useState(PRESETS[0].response);
  const [filter,   setFilter]   = useState<"all"|"error"|"warning"|"info">("all");

  const result = useMemo(() => {
    try {
      const issues = validate(JSON.parse(schema), JSON.parse(response));
      return { ok:true, issues };
    } catch {
      let sv = true, rv = true;
      try { JSON.parse(schema); } catch { sv = false; }
      try { JSON.parse(response); } catch { rv = false; }
      return { ok:false, issues:[], sv, rv };
    }
  }, [schema, response]);

  const errors   = result.issues.filter(i => i.severity === "error").length;
  const warnings = result.issues.filter(i => i.severity === "warning").length;
  const infos    = result.issues.filter(i => i.severity === "info").length;
  const filtered = result.issues.filter(i => filter === "all" || i.severity === filter);
  const isValid  = result.ok && errors === 0;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-surface/50 p-4 flex items-start gap-3">
        <span className="text-2xl">🔍</span>
        <div>
          <h3 className="text-sm font-semibold text-text-primary">{isRu ? "Валидатор ответов API" : "API Response Validator"}</h3>
          <p className="text-xs text-text-muted mt-0.5">{isRu ? "Вставь схему (из Swagger/Postman) и реальный ответ — найдём отсутствующие поля, неверные типы и лишние данные." : "Paste schema (from Swagger/Postman) and actual response — find missing fields, wrong types and extra data."}</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <span className="text-xs text-text-muted self-center">{isRu ? "Пресеты:" : "Presets:"}</span>
        {PRESETS.map(p => (
          <button key={p.label} onClick={() => { setSchema(p.schema); setResponse(p.response); }}
            className="rounded border border-border bg-surface px-3 py-1.5 text-xs text-text-muted hover:bg-surface-hover transition-colors">{p.label}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="input-label">{isRu ? "JSON Schema (эталон)" : "JSON Schema (expected)"}</label>
            <textarea value={schema} onChange={e => setSchema(e.target.value)} rows={12} spellCheck={false}
              className="code-surface w-full rounded-lg p-3 font-mono text-sm text-text-primary outline-none" />
          </div>
          <div>
            <label className="input-label">{isRu ? "Реальный ответ API" : "Actual API Response"}</label>
            <textarea value={response} onChange={e => setResponse(e.target.value)} rows={12} spellCheck={false}
              className="code-surface w-full rounded-lg p-3 font-mono text-sm text-text-primary outline-none" />
          </div>
        </div>

        <div className="space-y-4">
          {result.ok && (
            <div className={`rounded-xl border p-4 ${isValid ? "border-green-500/30 bg-green-500/5" : errors > 0 ? "border-red-500/30 bg-red-500/5" : "border-amber-500/30 bg-amber-500/5"}`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{isValid ? "✅" : errors > 0 ? "❌" : "⚠️"}</span>
                <div>
                  <p className={`text-base font-bold ${isValid ? "text-success" : errors > 0 ? "text-error" : "text-amber-400"}`}>
                    {isValid ? (isRu ? "Ответ соответствует схеме" : "Response matches schema") : errors > 0 ? (isRu ? "Критичные расхождения" : "Critical mismatches") : (isRu ? "Предупреждения" : "Warnings found")}
                  </p>
                  <div className="flex gap-3 mt-1">
                    {errors > 0 && <span className="text-xs text-red-400">{errors} {isRu ? "ошибок" : "errors"}</span>}
                    {warnings > 0 && <span className="text-xs text-amber-400">{warnings} {isRu ? "предупр." : "warnings"}</span>}
                    {infos > 0 && <span className="text-xs text-blue-400">{infos} info</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {result.issues.length > 0 && (
            <div className="flex gap-1 rounded border border-border overflow-hidden w-fit">
              {(["all","error","warning","info"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-xs transition-colors ${filter === f ? "bg-accent text-accent-fg font-medium" : "bg-surface text-text-muted hover:bg-surface-hover"}`}>
                  {f === "all" ? (isRu ? "Все" : "All") : f} {f !== "all" && `(${f==="error"?errors:f==="warning"?warnings:infos})`}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-2 max-h-[480px] overflow-y-auto">
            {filtered.map((issue, i) => {
              const s = SEV[issue.severity];
              return (
                <div key={i} className={`rounded-lg border p-3 ${s.bg}`}>
                  <div className="flex items-start gap-2">
                    <span className={`shrink-0 font-bold ${s.color}`}>{s.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <code className="font-mono text-xs font-semibold text-text-primary">{issue.path}</code>
                        <span className={`rounded border px-1.5 py-px text-[9px] font-medium ${s.bg} ${s.color}`}>
                          {isRu ? TYPE_LABELS[issue.type][1] : TYPE_LABELS[issue.type][0]}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted">
                        {isRu ? "Ожидалось:" : "Expected:"} <code className="font-mono text-text-secondary">{issue.expected}</code>
                        {" → "}
                        {isRu ? "Получено:" : "Got:"} <code className={`font-mono ${s.color}`}>{issue.actual}</code>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            {result.ok && result.issues.length === 0 && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-8 text-center">
                <p className="text-3xl mb-2">🎉</p>
                <p className="text-sm font-semibold text-success">{isRu ? "Идеальное совпадение!" : "Perfect match!"}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}