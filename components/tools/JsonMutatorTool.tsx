"use client";
import { useCallback, useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

// ─── Types ───────────────────────────────────────────────────────────────────

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };
type MutationType = "type" | "boundary" | "injection" | "all";

interface FieldPath { path: string[]; type: string; value: JsonValue; }
interface Mutation  { label: string; labelRu: string; value: JsonValue; category: string; }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function detectType(val: JsonValue): string {
  if (val === null)           return "null";
  if (Array.isArray(val))     return "array";
  if (typeof val === "object") return "object";
  return typeof val; // string | number | boolean
}

function flattenPaths(obj: JsonValue, prefix: string[] = []): FieldPath[] {
  if (typeof obj !== "object" || obj === null) return [];
  const result: FieldPath[] = [];
  const entries = Array.isArray(obj)
    ? obj.map((v, i) => [`${i}`, v] as [string, JsonValue])
    : Object.entries(obj as Record<string, JsonValue>);

  for (const [key, val] of entries) {
    const path = [...prefix, key];
    result.push({ path, type: detectType(val), value: val });
    if (typeof val === "object" && val !== null) {
      result.push(...flattenPaths(val, path));
    }
  }
  return result;
}

function setPath(obj: JsonValue, path: string[], value: JsonValue): JsonValue {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  if (Array.isArray(obj)) {
    const idx = parseInt(head);
    const arr = [...obj];
    arr[idx] = setPath(arr[idx], rest, value);
    return arr;
  }
  const o = { ...(obj as Record<string, JsonValue>) };
  o[head] = setPath(o[head], rest, value);
  return o;
}

function getMutations(type: string): Mutation[] {
  const shared: Mutation[] = [
    { label:"null",                    labelRu:"null",                     value:null,             category:"type" },
    { label:"Empty string",            labelRu:"Пустая строка",            value:"",               category:"type" },
    { label:"Number (0)",              labelRu:"Число (0)",                value:0,                category:"type" },
    { label:"Boolean true",            labelRu:"Булево true",              value:true,             category:"type" },
    { label:"Boolean false",           labelRu:"Булево false",             value:false,            category:"type" },
    { label:"Empty array",             labelRu:"Пустой массив",            value:[],               category:"type" },
    { label:"Empty object",            labelRu:"Пустой объект",            value:{},               category:"type" },
    { label:'String "null"',           labelRu:'Строка "null"',            value:"null",           category:"type" },
    { label:'String "undefined"',      labelRu:'Строка "undefined"',       value:"undefined",      category:"type" },
    { label:'String "true"',           labelRu:'Строка "true"',            value:"true",           category:"type" },
  ];

  const byType: Record<string, Mutation[]> = {
    string: [
      { label:"Whitespace only",         labelRu:"Только пробелы",          value:"   ",            category:"boundary" },
      { label:"Very long string (1000)", labelRu:"Очень длинная (1000)",    value:"a".repeat(1000), category:"boundary" },
      { label:"Unicode chars",           labelRu:"Unicode символы",         value:"áéíóú ñ 中文 🎉",  category:"boundary" },
      { label:"Special chars",           labelRu:"Спецсимволы",             value:"!@#$%^&*()_+-=", category:"boundary" },
      { label:"SQL injection",           labelRu:"SQL инъекция",            value:"' OR 1=1 --",   category:"injection" },
      { label:"XSS payload",             labelRu:"XSS нагрузка",            value:'<script>alert(1)</script>', category:"injection" },
      { label:"Path traversal",          labelRu:"Path traversal",          value:"../../etc/passwd", category:"injection" },
      { label:"CRLF injection",          labelRu:"CRLF инъекция",           value:"value\r\nHeader: injected", category:"injection" },
      { label:"Format string",           labelRu:"Format string",           value:"%s%s%s%s%s",    category:"injection" },
      { label:"Zero-width chars",        labelRu:"Невидимые символы",       value:"val\u200Bue",   category:"boundary" },
    ],
    number: [
      { label:"Negative (-1)",           labelRu:"Отрицательное (-1)",      value:-1,               category:"boundary" },
      { label:"Zero (0)",                labelRu:"Ноль (0)",                value:0,                category:"boundary" },
      { label:"Max safe integer",        labelRu:"Макс. safe integer",      value:Number.MAX_SAFE_INTEGER, category:"boundary" },
      { label:"Min safe integer",        labelRu:"Мин. safe integer",       value:Number.MIN_SAFE_INTEGER, category:"boundary" },
      { label:"Float (1.5)",             labelRu:"Дробное (1.5)",           value:1.5,              category:"boundary" },
      { label:"Infinity as string",      labelRu:"Infinity строкой",        value:"Infinity",       category:"boundary" },
      { label:"NaN as string",           labelRu:"NaN строкой",             value:"NaN",            category:"boundary" },
      { label:"Numeric string",          labelRu:"Число строкой",           value:"123",            category:"type" },
      { label:"Negative float",          labelRu:"Отрицательное дробное",   value:-0.001,           category:"boundary" },
      { label:"Very large number",       labelRu:"Очень большое число",     value:999999999999,     category:"boundary" },
    ],
    boolean: [
      { label:'String "false"',          labelRu:'Строка "false"',          value:"false",          category:"type" },
      { label:'String "0"',              labelRu:'Строка "0"',              value:"0",              category:"type" },
      { label:"Number 0",                labelRu:"Число 0",                 value:0,                category:"type" },
      { label:"Number 1",                labelRu:"Число 1",                 value:1,                category:"type" },
    ],
    array: [
      { label:"Single null item",        labelRu:"Один null элемент",       value:[null],           category:"boundary" },
      { label:"Very large array (100)",  labelRu:"Большой массив (100)",    value:Array(100).fill("item"), category:"boundary" },
      { label:"Mixed types",             labelRu:"Разные типы",             value:[1,"two",true,null,{}], category:"type" },
      { label:"Nested array",            labelRu:"Вложенный массив",        value:[[1,2],[3,4]],    category:"type" },
    ],
    object: [
      { label:"Extra unknown field",     labelRu:"Лишнее поле",             value:{ unknown_field:"evil" }, category:"boundary" },
      { label:"Deeply nested",           labelRu:"Глубокая вложенность",    value:{ a:{ b:{ c:{ d:"deep" } } } }, category:"boundary" },
    ],
  };

  const extra = byType[type] ?? [];
  return [...shared, ...extra];
}

const CATEGORY_META: Record<string, { label: string; labelRu: string; color: string }> = {
  type:      { label:"Type mutation",  labelRu:"Тип",      color:"text-blue-400 border-blue-500/30 bg-blue-500/10" },
  boundary:  { label:"Boundary",       labelRu:"Граница",  color:"text-amber-400 border-amber-500/30 bg-amber-500/10" },
  injection: { label:"Injection",      labelRu:"Инъекция", color:"text-red-400 border-red-500/30 bg-red-500/10" },
};

const SAMPLE = `{
  "username": "alice",
  "age": 25,
  "active": true,
  "role": "admin",
  "tags": ["qa", "dev"],
  "address": {
    "city": "Yerevan",
    "zip": "0001"
  }
}`;

// ─── Component ────────────────────────────────────────────────────────────────

export function JsonMutatorTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.common.copy === "Копировать";

  const [input,        setInput]        = useState(SAMPLE);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [filterCat,    setFilterCat]    = useState<MutationType>("all");
  const [mode,         setMode]         = useState<"single" | "all">("single");
  const [copied,       setCopied]       = useState<string | null>(null);

  // Parse JSON
  const parsed = useMemo<{ ok: boolean; data: JsonValue | null; error: string }>(() => {
    try { return { ok: true, data: JSON.parse(input), error: "" }; }
    catch (e) { return { ok: false, data: null, error: e instanceof Error ? e.message : "Invalid JSON" }; }
  }, [input]);

  // All field paths
  const fields = useMemo(() =>
    parsed.ok && parsed.data ? flattenPaths(parsed.data) : [],
    [parsed]
  );

  const selected = fields.find(f => f.path.join(".") === selectedPath) ?? null;
  const mutations = selected ? getMutations(selected.type) : [];
  const filtered  = filterCat === "all" ? mutations : mutations.filter(m => m.category === filterCat);

  // Generate mutated body
  function mutate(value: JsonValue): string {
    if (!parsed.data || !selected) return "";
    const mutated = setPath(parsed.data, selected.path, value);
    return JSON.stringify(mutated, null, 2);
  }

  // All mutations output
  const allMutations = useMemo(() => {
    if (!selected || mode !== "all") return [];
    return filtered.map(m => ({
      label:   isRu ? m.labelRu : m.label,
      category: m.category,
      body:    mutate(m.value),
    }));
  }, [selected, filtered, mode, isRu, parsed.data]);

  function copyValue(text: string, key: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  const fieldsByDepth = fields.filter(f =>
    typeof f.value !== "object" || f.value === null
  );
  const fieldGroups = fields.filter(f =>
    typeof f.value === "object" && f.value !== null
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-lg border border-border bg-surface/50 p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔬</span>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              {isRu ? "JSON Mutator — Негативное тестирование API" : "JSON Mutator — API Negative Testing"}
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              {isRu
                ? "Вставь JSON body из Postman или Swagger, выбери поле — получи варианты с мутированными значениями для негативных тест-кейсов."
                : "Paste your JSON body from Postman or Swagger, pick a field — get mutated values for negative test cases."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Left — Input */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="input-label">
                {isRu ? "JSON Body (из Postman/Swagger)" : "JSON Body (from Postman/Swagger)"}
              </label>
              {parsed.ok && (
                <span className="text-[10px] text-success">✓ Valid JSON · {fields.length} {isRu ? "полей" : "fields"}</span>
              )}
            </div>
            <textarea value={input} onChange={e => { setInput(e.target.value); setSelectedPath(null); }}
              rows={12} spellCheck={false}
              className={`code-surface w-full rounded-lg p-3 font-mono text-sm text-text-primary outline-none ${!parsed.ok && input ? "border border-red-500/50" : ""}`} />
            {!parsed.ok && input && (
              <p className="mt-1 text-xs text-red-400">{parsed.error}</p>
            )}
          </div>

          {/* Field selector */}
          {parsed.ok && fields.length > 0 && (
            <div>
              <label className="input-label">{isRu ? "Выбери поле для мутации" : "Select field to mutate"}</label>
              <div className="space-y-1 max-h-48 overflow-y-auto code-surface rounded-lg p-2">
                {/* Primitive fields */}
                {fieldsByDepth.length > 0 && (
                  <p className="px-2 py-1 text-[10px] uppercase tracking-wider text-text-muted">{isRu ? "Примитивы" : "Primitive fields"}</p>
                )}
                {fieldsByDepth.map(f => {
                  const pathStr = f.path.join(".");
                  const isSelected = selectedPath === pathStr;
                  return (
                    <button key={pathStr} onClick={() => setSelectedPath(isSelected ? null : pathStr)}
                      className={`w-full flex items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors ${
                        isSelected ? "bg-accent/10 text-accent border border-accent/30" : "text-text-muted hover:bg-surface-hover"
                      }`}>
                      <span className="font-mono truncate">{pathStr}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`rounded border px-1.5 py-px text-[9px] font-mono ${
                          f.type === "string"  ? "border-violet-500/30 bg-violet-500/10 text-violet-400" :
                          f.type === "number"  ? "border-blue-500/30 bg-blue-500/10 text-blue-400" :
                          f.type === "boolean" ? "border-amber-500/30 bg-amber-500/10 text-amber-400" :
                          "border-border text-text-muted"
                        }`}>{f.type}</span>
                        <span className="text-text-disabled font-mono text-[10px] max-w-[80px] truncate">
                          {JSON.stringify(f.value)}
                        </span>
                      </div>
                    </button>
                  );
                })}
                {/* Complex fields */}
                {fieldGroups.length > 0 && (
                  <p className="px-2 py-1 text-[10px] uppercase tracking-wider text-text-muted mt-2">{isRu ? "Объекты/Массивы" : "Objects/Arrays"}</p>
                )}
                {fieldGroups.map(f => {
                  const pathStr = f.path.join(".");
                  const isSelected = selectedPath === pathStr;
                  return (
                    <button key={pathStr} onClick={() => setSelectedPath(isSelected ? null : pathStr)}
                      className={`w-full flex items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors ${
                        isSelected ? "bg-accent/10 text-accent border border-accent/30" : "text-text-muted hover:bg-surface-hover"
                      }`}>
                      <span className="font-mono truncate">{pathStr}</span>
                      <span className={`rounded border px-1.5 py-px text-[9px] font-mono ${
                        f.type === "array" ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-border text-text-muted"
                      }`}>{f.type}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right — Mutations */}
        <div className="space-y-4">
          {!selected ? (
            <div className="code-surface rounded-lg h-full flex flex-col items-center justify-center py-16 text-center">
              <span className="text-4xl mb-3">👈</span>
              <p className="text-sm font-medium text-text-primary">
                {isRu ? "Выбери поле слева" : "Select a field on the left"}
              </p>
              <p className="text-xs text-text-muted mt-1">
                {isRu ? "Инструмент сгенерирует варианты мутаций" : "The tool will generate mutation variants"}
              </p>
            </div>
          ) : (
            <>
              {/* Selected field info */}
              <div className="rounded-lg border border-border bg-surface p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-muted">{isRu ? "Мутируем поле:" : "Mutating field:"}</p>
                  <p className="font-mono text-sm font-semibold text-accent">{selected.path.join(".")}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-muted">{isRu ? "Текущее значение:" : "Current value:"}</p>
                  <p className="font-mono text-xs text-text-secondary">{JSON.stringify(selected.value)}</p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap gap-2 items-center">
                {/* Category filter */}
                <div className="flex rounded border border-border overflow-hidden">
                  {(["all","type","boundary","injection"] as const).map(cat => (
                    <button key={cat} onClick={() => setFilterCat(cat)}
                      className={`px-2.5 py-1.5 text-xs capitalize transition-colors ${filterCat === cat ? "bg-accent text-accent-fg" : "bg-surface text-text-muted hover:bg-surface-hover"}`}>
                      {cat === "all" ? (isRu ? "Все" : "All") :
                       cat === "type" ? (isRu ? "Типы" : "Types") :
                       cat === "boundary" ? (isRu ? "Границы" : "Boundary") :
                       (isRu ? "Инъекции" : "Injection")}
                    </button>
                  ))}
                </div>

                {/* Mode */}
                <div className="flex rounded border border-border overflow-hidden ml-auto">
                  <button onClick={() => setMode("single")}
                    className={`px-2.5 py-1.5 text-xs transition-colors ${mode === "single" ? "bg-surface-hover text-text-primary" : "bg-surface text-text-muted hover:bg-surface-hover"}`}>
                    {isRu ? "По одному" : "One by one"}
                  </button>
                  <button onClick={() => setMode("all")}
                    className={`px-2.5 py-1.5 text-xs transition-colors ${mode === "all" ? "bg-surface-hover text-text-primary" : "bg-surface text-text-muted hover:bg-surface-hover"}`}>
                    {isRu ? "Все сразу" : "All at once"}
                  </button>
                </div>
              </div>

              <p className="text-xs text-text-muted">{filtered.length} {isRu ? "мутаций" : "mutations"}</p>

              {/* Single mode — list */}
              {mode === "single" && (
                <div className="space-y-2 max-h-[420px] overflow-y-auto">
                  {filtered.map((m, i) => {
                    const mutated = mutate(m.value);
                    const key     = `${selectedPath}-${i}`;
                    const meta    = CATEGORY_META[m.category];
                    return (
                      <div key={i} className="rounded-lg border border-border bg-surface overflow-hidden hover:border-border-focus transition-colors">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                          <div className="flex items-center gap-2">
                            <span className={`rounded border px-1.5 py-px text-[9px] font-medium ${meta?.color ?? "text-text-muted border-border bg-surface"}`}>
                              {isRu ? meta?.labelRu : meta?.label}
                            </span>
                            <span className="text-xs text-text-secondary">{isRu ? m.labelRu : m.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-text-muted bg-canvas px-1.5 py-0.5 rounded">
                              {JSON.stringify(m.value)?.slice(0, 20)}{(JSON.stringify(m.value)?.length ?? 0) > 20 ? "…" : ""}
                            </span>
                            <button onClick={() => copyValue(mutated, key)}
                              className={`text-xs transition-colors ${copied === key ? "text-success" : "text-text-muted hover:text-text-primary"}`}>
                              {copied === key ? "✓" : (isRu ? "Копировать" : "Copy")}
                            </button>
                          </div>
                        </div>
                        <pre className="p-2 font-mono text-[10px] text-text-secondary leading-relaxed max-h-24 overflow-auto">
                          {mutated}
                        </pre>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* All mode — numbered list */}
              {mode === "all" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-text-muted">{isRu ? "Все варианты для копирования:" : "All variants to copy:"}</p>
                    <button onClick={() => copyValue(
                      allMutations.map((m, i) => `// Test case ${i+1}: ${m.label}\n${m.body}`).join("\n\n"),
                      "all"
                    )} className={`text-xs transition-colors ${copied === "all" ? "text-success" : "text-text-muted hover:text-text-primary"}`}>
                      {copied === "all" ? "✓ Copied" : (isRu ? "Копировать всё" : "Copy all")}
                    </button>
                  </div>
                  <div className="max-h-[380px] overflow-y-auto space-y-2">
                    {allMutations.map((m, i) => {
                      const key = `all-${i}`;
                      return (
                        <div key={i} className="rounded-lg border border-border bg-surface overflow-hidden">
                          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-canvas/50">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-text-muted font-mono">#{i+1}</span>
                              <span className="text-xs text-text-secondary">{m.label}</span>
                              <span className={`rounded border px-1 py-px text-[9px] font-medium ${CATEGORY_META[m.category]?.color ?? ""}`}>
                                {isRu ? CATEGORY_META[m.category]?.labelRu : CATEGORY_META[m.category]?.label}
                              </span>
                            </div>
                            <button onClick={() => copyValue(m.body, key)}
                              className={`text-xs ${copied === key ? "text-success" : "text-text-muted hover:text-text-primary"}`}>
                              {copied === key ? "✓" : (isRu ? "Копировать" : "Copy")}
                            </button>
                          </div>
                          <pre className="p-2 font-mono text-[10px] text-text-secondary max-h-20 overflow-auto">{m.body}</pre>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="rounded-lg border border-border bg-surface/50 p-4">
        <p className="text-xs font-semibold text-text-primary mb-2">
          {isRu ? "💡 Как использовать:" : "💡 How to use:"}
        </p>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3 text-xs text-text-muted">
          <span>1. {isRu ? "Вставь JSON body из Postman" : "Paste JSON body from Postman"}</span>
          <span>2. {isRu ? "Выбери поле которое хочешь мутировать" : "Select the field to mutate"}</span>
          <span>3. {isRu ? "Скопируй нужный вариант и отправь запрос" : "Copy a variant and send the request"}</span>
        </div>
      </div>
    </div>
  );
}