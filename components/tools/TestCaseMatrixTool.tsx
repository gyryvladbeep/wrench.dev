"use client";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

interface Param { name: string; values: string; }

type ExportFormat = "table" | "csv" | "gherkin" | "json";

function cartesian(arrays: string[][]): string[][] {
  return arrays.reduce<string[][]>(
    (acc, arr) => acc.flatMap(combo => arr.map(val => [...combo, val])),
    [[]]
  );
}

// Pairwise algorithm (simplified) — covers all pairs at least once
function pairwise(params: { name: string; vals: string[] }[]): string[][] {
  if (params.length === 0) return [];
  if (params.length === 1) return params[0].vals.map(v => [v]);

  // Start with full cartesian of first two params
  const [p0, p1, ...rest] = params;
  let pairs = cartesian([p0.vals, p1.vals]);

  // For each additional param, cover all pairs with previous params
  for (const param of rest) {
    const extended: string[][] = [];
    const needed = new Set<string>();

    // Collect all pairs we need to cover
    for (let i = 0; i < pairs[0].length; i++) {
      for (const val of param.vals) {
        needed.add(`${i}:${pairs[0][i]}|${val}`);
      }
    }

    // Try to cover pairs greedily
    for (const val of param.vals) {
      for (const pair of pairs) {
        const key = `${pairs.indexOf(pair)}:${pair[pair.indexOf(pair[0])]}|${val}`;
        if (needed.has(key)) {
          extended.push([...pair, val]);
          needed.delete(key);
        }
      }
    }

    // Add remaining with any value
    for (const pair of pairs) {
      if (!extended.some(e => e.slice(0, pair.length).join(",") === pair.join(","))) {
        extended.push([...pair, param.vals[0]]);
      }
    }

    pairs = extended.length > 0 ? extended : pairs.map(p => [...p, param.vals[0]]);
  }

  return pairs;
}

function formatOutput(
  combinations: string[][],
  params: { name: string; vals: string[] }[],
  format: ExportFormat,
  isRu: boolean
): string {
  if (combinations.length === 0) return "";

  switch (format) {
    case "table": {
      const header = ["#", ...params.map(p => p.name)].join("\t");
      const rows   = combinations.map((c, i) => [i + 1, ...c].join("\t"));
      return [header, ...rows].join("\n");
    }
    case "csv": {
      const header = ["#", ...params.map(p => `"${p.name}"`)].join(",");
      const rows   = combinations.map((c, i) => [i + 1, ...c.map(v => `"${v}"`)].join(","));
      return [header, ...rows].join("\n");
    }
    case "gherkin": {
      const header = `    | ${params.map(p => p.name.padEnd(12)).join(" | ")} |`;
      const rows   = combinations.map(c => `    | ${c.map(v => v.padEnd(12)).join(" | ")} |`);
      return [
        `  ${isRu ? "Структура сценария" : "Scenario Outline"}: ${isRu ? "Тест" : "Test"} <${params.map(p => p.name).join(">, <")}>`,
        `    ${isRu ? "Дано" : "Given"} ...`,
        `    ${isRu ? "Когда" : "When"} ...`,
        `    ${isRu ? "Тогда" : "Then"} ...`,
        "",
        `  ${isRu ? "Примеры" : "Examples"}:`,
        header,
        ...rows
      ].join("\n");
    }
    case "json": {
      const arr = combinations.map((c, i) => {
        const obj: Record<string, string | number> = { id: i + 1 };
        params.forEach((p, idx) => { obj[p.name] = c[idx]; });
        return obj;
      });
      return JSON.stringify(arr, null, 2);
    }
  }
}

const PRESETS = [
  {
    label: "Login form",
    labelRu: "Форма входа",
    params: [
      { name: "username", values: "valid, empty, too_long, special_chars" },
      { name: "password", values: "valid, empty, too_short, wrong" },
      { name: "remember_me", values: "true, false" },
    ],
  },
  {
    label: "API endpoint",
    labelRu: "API эндпоинт",
    params: [
      { name: "role",   values: "admin, user, guest, banned" },
      { name: "method", values: "GET, POST, PUT, DELETE" },
      { name: "auth",   values: "valid_token, expired_token, no_token" },
    ],
  },
  {
    label: "File upload",
    labelRu: "Загрузка файла",
    params: [
      { name: "format",    values: "jpg, png, pdf, exe, gif" },
      { name: "size",      values: "1kb, 4mb, 5mb, 6mb" },
      { name: "filename",  values: "normal, spaces, special_chars, very_long" },
    ],
  },
];

export function TestCaseMatrixTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.common.copy === "Копировать";

  const [params,   setParams]  = useState<Param[]>([
    { name: "role",   values: "admin, user, guest" },
    { name: "status", values: "active, inactive, banned" },
    { name: "method", values: "GET, POST, DELETE" },
  ]);
  const [mode,     setMode]    = useState<"all" | "pairwise">("pairwise");
  const [format,   setFormat]  = useState<ExportFormat>("table");

  function addParam() {
    setParams(p => [...p, { name: `param${p.length + 1}`, values: "" }]);
  }

  function removeParam(i: number) {
    setParams(p => p.filter((_, j) => j !== i));
  }

  function updateParam(i: number, field: keyof Param, val: string) {
    setParams(p => p.map((item, j) => j === i ? { ...item, [field]: val } : item));
  }

  function applyPreset(preset: typeof PRESETS[0]) {
    setParams(preset.params);
  }

  const parsedParams = useMemo(() =>
    params
      .filter(p => p.name.trim() && p.values.trim())
      .map(p => ({
        name: p.name.trim(),
        vals: p.values.split(",").map(v => v.trim()).filter(Boolean),
      }))
      .filter(p => p.vals.length > 0),
    [params]
  );

  const combinations = useMemo(() => {
    if (parsedParams.length === 0) return [];
    if (mode === "all") {
      return cartesian(parsedParams.map(p => p.vals));
    }
    return pairwise(parsedParams);
  }, [parsedParams, mode]);

  const allCombinations = useMemo(() =>
    parsedParams.length > 0 ? cartesian(parsedParams.map(p => p.vals)) : [],
    [parsedParams]
  );

  const output = useMemo(() =>
    formatOutput(combinations, parsedParams, format, isRu),
    [combinations, parsedParams, format, isRu]
  );

  const coverage = allCombinations.length > 0
    ? Math.round((combinations.length / allCombinations.length) * 100)
    : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-lg border border-border bg-surface/50 p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🧮</span>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              {isRu ? "Матрица тест-кейсов" : "Test Case Matrix Generator"}
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              {isRu
                ? "Введи параметры и их значения — инструмент сгенерирует все комбинации или оптимальный набор (pairwise) для максимального покрытия при минимуме тестов."
                : "Enter parameters and their values — get all combinations or an optimal pairwise set for maximum coverage with minimum tests."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Left — params */}
        <div className="space-y-4">
          {/* Presets */}
          <div>
            <label className="input-label">{isRu ? "Пресеты" : "Presets"}</label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map(p => (
                <button key={p.label} onClick={() => applyPreset(p)}
                  className="rounded border border-border bg-surface px-3 py-1.5 text-xs text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors">
                  {isRu ? p.labelRu : p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Params */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="input-label mb-0">{isRu ? "Параметры" : "Parameters"}</label>
              <button onClick={addParam}
                className="text-xs text-accent hover:underline">
                + {isRu ? "Добавить" : "Add parameter"}
              </button>
            </div>

            {params.map((p, i) => (
              <div key={i} className="rounded-lg border border-border bg-surface p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">{i+1}</span>
                  <input value={p.name} onChange={e => updateParam(i, "name", e.target.value)}
                    placeholder={isRu ? "Название параметра" : "Parameter name"}
                    className="code-surface flex-1 rounded px-2.5 py-1.5 text-xs text-text-primary outline-none" />
                  <button onClick={() => removeParam(i)}
                    className="text-text-disabled hover:text-error transition-colors text-sm">✕</button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-text-muted w-5 shrink-0">{isRu ? "знач." : "vals"}</span>
                  <input value={p.values} onChange={e => updateParam(i, "values", e.target.value)}
                    placeholder={isRu ? "val1, val2, val3" : "val1, val2, val3"}
                    className="code-surface flex-1 rounded px-2.5 py-1.5 text-xs text-text-primary outline-none" />
                </div>
                {p.values.trim() && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {p.values.split(",").map(v => v.trim()).filter(Boolean).map((v, j) => (
                      <span key={j} className="rounded border border-border bg-canvas px-1.5 py-px text-[10px] text-text-muted">{v}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mode + Format */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">{isRu ? "Режим" : "Mode"}</label>
              <div className="flex rounded border border-border overflow-hidden">
                <button onClick={() => setMode("pairwise")}
                  className={`flex-1 py-2 text-xs transition-colors ${mode === "pairwise" ? "bg-accent text-accent-fg font-medium" : "bg-surface text-text-muted hover:bg-surface-hover"}`}>
                  Pairwise
                </button>
                <button onClick={() => setMode("all")}
                  className={`flex-1 py-2 text-xs transition-colors ${mode === "all" ? "bg-accent text-accent-fg font-medium" : "bg-surface text-text-muted hover:bg-surface-hover"}`}>
                  {isRu ? "Все" : "All"}
                </button>
              </div>
              <p className="mt-1 text-[10px] text-text-muted">
                {mode === "pairwise"
                  ? (isRu ? "Оптимальный набор, покрывает все пары" : "Optimal set covering all pairs")
                  : (isRu ? "Полный перебор всех комбинаций" : "Full cartesian product")}
              </p>
            </div>
            <div>
              <label className="input-label">{isRu ? "Формат" : "Format"}</label>
              <div className="flex rounded border border-border overflow-hidden">
                {(["table","csv","gherkin","json"] as ExportFormat[]).map(f => (
                  <button key={f} onClick={() => setFormat(f)}
                    className={`flex-1 py-2 text-xs uppercase transition-colors ${format === f ? "bg-accent text-accent-fg font-medium" : "bg-surface text-text-muted hover:bg-surface-hover"}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right — output */}
        <div className="space-y-3">
          {/* Stats */}
          {parsedParams.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-border bg-surface p-3 text-center">
                <p className="text-xl font-bold text-accent">{combinations.length}</p>
                <p className="text-[10px] text-text-muted">{isRu ? "тест-кейсов" : "test cases"}</p>
              </div>
              <div className="rounded-lg border border-border bg-surface p-3 text-center">
                <p className="text-xl font-bold text-text-primary">{allCombinations.length}</p>
                <p className="text-[10px] text-text-muted">{isRu ? "всего комбинаций" : "total combos"}</p>
              </div>
              <div className="rounded-lg border border-border bg-surface p-3 text-center">
                <p className={`text-xl font-bold ${coverage >= 100 ? "text-success" : "text-amber-400"}`}>{coverage}%</p>
                <p className="text-[10px] text-text-muted">{isRu ? "покрытие" : "coverage"}</p>
              </div>
            </div>
          )}

          {/* Visual table preview */}
          {combinations.length > 0 && parsedParams.length > 0 && (
            <div className="overflow-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="px-3 py-2 text-left text-[10px] text-text-muted font-medium">#</th>
                    {parsedParams.map(p => (
                      <th key={p.name} className="px-3 py-2 text-left text-[10px] text-text-muted font-medium">{p.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {combinations.slice(0, 20).map((combo, i) => (
                    <tr key={i} className={`border-b border-border/50 ${i % 2 === 0 ? "bg-canvas" : "bg-surface/30"}`}>
                      <td className="px-3 py-1.5 text-text-muted font-mono">{i+1}</td>
                      {combo.map((val, j) => (
                        <td key={j} className="px-3 py-1.5 text-text-primary">{val}</td>
                      ))}
                    </tr>
                  ))}
                  {combinations.length > 20 && (
                    <tr>
                      <td colSpan={parsedParams.length + 1} className="px-3 py-2 text-center text-[10px] text-text-muted">
                        +{combinations.length - 20} {isRu ? "ещё строк" : "more rows"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Export */}
          {output && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="input-label mb-0">
                  {format.toUpperCase()} {isRu ? "экспорт" : "export"}
                </label>
                <CopyButton value={output} />
              </div>
              <textarea readOnly value={output} rows={8} spellCheck={false}
                className="code-surface w-full rounded-lg p-3 font-mono text-xs text-text-primary outline-none" />
            </div>
          )}

          {!output && parsedParams.length === 0 && (
            <div className="code-surface rounded-lg flex items-center justify-center py-16 text-center">
              <div>
                <p className="text-2xl mb-2">🧮</p>
                <p className="text-sm text-text-muted">{isRu ? "Добавь параметры слева" : "Add parameters on the left"}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Explanation */}
      <div className="rounded-lg border border-border bg-surface/50 p-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold text-text-primary mb-1">
            {isRu ? "Что такое Pairwise?" : "What is Pairwise testing?"}
          </p>
          <p className="text-xs text-text-muted leading-relaxed">
            {isRu
              ? "Техника тест-дизайна которая гарантирует что каждая пара значений встречается хотя бы в одном тест-кейсе. Снижает количество тестов в 3-10 раз при сохранении высокого покрытия."
              : "A test design technique ensuring every pair of values appears in at least one test case. Reduces test count 3-10x while maintaining high defect detection rate."}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-text-primary mb-1">
            {isRu ? "Когда использовать?" : "When to use?"}
          </p>
          <p className="text-xs text-text-muted leading-relaxed">
            {isRu
              ? "Когда полный перебор нереален — например 4 параметра по 5 значений = 625 тестов. Pairwise сократит до ~25 при покрытии всех пар."
              : "When full combinatorial is impractical — 4 params × 5 values = 625 tests. Pairwise reduces this to ~25 while covering all pairs."}
          </p>
        </div>
      </div>
    </div>
  );
}