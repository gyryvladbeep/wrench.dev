"use client";
import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { CopyButton } from "@/components/CopyButton";
import { DEFAULT_DIMENSIONS, fullCount, fullFactorial, missingPairs, pairwise, parseDimensions, toCsv, toMarkdown } from "@/lib/messenger/scenario-matrix";
import { btnClass, download, Field, Panel, Stat, areaClass, inputClass } from "./messenger/ui";

export function ChatScenarioMatrixGeneratorTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [text, setText] = useState(DEFAULT_DIMENSIONS);
  const [strategy, setStrategy] = useState<"pairwise" | "full">("pairwise");
  const { dims, errors } = useMemo(() => parseDimensions(text), [text]);
  const total = errors.length === 0 ? fullCount(dims) : 0;
  const rows = useMemo(() => (errors.length > 0 ? [] : strategy === "pairwise" ? pairwise(dims) : fullFactorial(dims)), [dims, errors, strategy]);
  const missing = useMemo(() => (strategy === "pairwise" && errors.length === 0 ? missingPairs(dims, rows) : 0), [dims, rows, strategy, errors]);
  const shown = rows.slice(0, 300);

  return (
    <div className="space-y-5 max-w-4xl">
      <Field id="sx-dims" label={isRu ? "Измерения: Название: значение, значение" : "Dimensions: Name: value, value"} hint={isRu ? "Одна строка - одно измерение. Меняйте значения под свой мессенджер." : "One line per dimension. Change the values for your messenger."}>
        <textarea id="sx-dims" value={text} onChange={(e) => setText(e.target.value)} className={`${areaClass} min-h-[150px]`} spellCheck={false} />
      </Field>
      <Panel cols="sm:grid-cols-2">
        <Field id="sx-strategy" label={isRu ? "Стратегия" : "Strategy"}>
          <select id="sx-strategy" value={strategy} onChange={(e) => setStrategy(e.target.value as "pairwise" | "full")} className={inputClass}>
            <option value="pairwise">{isRu ? "Pairwise (все пары значений)" : "Pairwise (every pair of values)"}</option>
            <option value="full">{isRu ? "Полный перебор" : "Full combinations"}</option>
          </select>
        </Field>
      </Panel>
      {errors.length > 0 ? <ul className="text-sm text-red-300" data-testid="sx-errors">{errors.map((e, i) => <li key={i}>{e}</li>)}</ul> : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Stat id="sx-full" label={isRu ? "Полный перебор" : "Full combinations"} value={total} />
            <Stat id="sx-count" label={isRu ? "Строк в наборе" : "Rows in the set"} value={rows.length} />
            <Stat id="sx-missing" label={isRu ? "Непокрытых пар" : "Uncovered pairs"} value={missing} />
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyButton value={toMarkdown(dims, rows)} label={isRu ? "Копировать Markdown" : "Copy Markdown"} />
            <button type="button" data-testid="sx-csv" className={btnClass} onClick={() => download("chat-scenarios.csv", toCsv(dims, rows), "text/csv")}>{isRu ? "Скачать CSV" : "Download CSV"}</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="sx-table">
              <thead><tr className="text-left text-[11px] uppercase tracking-wider text-text-muted"><th className="px-3 py-2 font-medium">#</th>{dims.map((d) => <th key={d.name} className="px-3 py-2 font-medium">{d.name}</th>)}</tr></thead>
              <tbody>
                {shown.map((r, i) => (
                  <tr key={i} data-row={i + 1} className="border-t border-border">
                    <td className="px-3 py-1.5 text-text-muted">TC-{String(i + 1).padStart(3, "0")}</td>{r.map((v, j) => <td key={j} className="px-3 py-1.5">{v}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > shown.length ? <p className="text-xs text-text-muted">{isRu ? `Показаны первые ${shown.length}; в файлах все строки.` : `Showing the first ${shown.length}; the files contain all rows.`}</p> : null}
        </>
      )}
    </div>
  );
}
