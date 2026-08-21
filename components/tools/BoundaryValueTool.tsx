"use client";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

interface BVResult {
  value: number | string;
  type: "min_invalid" | "min_valid" | "min_plus1" | "nominal" | "max_minus1" | "max_valid" | "max_invalid";
  label: string;
  labelRu: string;
  isValid: boolean;
}

export function BoundaryValueTool({ dict }: { dict: Dictionary }) {
  const [min,      setMin]      = useState("1");
  const [max,      setMax]      = useState("100");
  const [dataType, setDataType] = useState<"integer" | "float" | "string">("integer");
  const isRu = dict.common.copy === "Копировать";

  const results = useMemo((): BVResult[] => {
    const mn = parseFloat(min);
    const mx = parseFloat(max);
    if (isNaN(mn) || isNaN(mx) || mn >= mx) return [];

    if (dataType === "string") {
      return [
        { value: 0,      type:"min_invalid",  label:"Below min length", labelRu:"Меньше мин. длины",   isValid:false },
        { value: mn,     type:"min_valid",     label:"Min length (valid)", labelRu:"Мин. длина (валид.)", isValid:true  },
        { value: mn + 1, type:"min_plus1",     label:"Min+1 (valid)",    labelRu:"Мин+1 (валидный)",    isValid:true  },
        { value: Math.floor((mn + mx) / 2), type:"nominal", label:"Nominal", labelRu:"Номинальный",     isValid:true  },
        { value: mx - 1, type:"max_minus1",    label:"Max-1 (valid)",    labelRu:"Макс-1 (валидный)",   isValid:true  },
        { value: mx,     type:"max_valid",     label:"Max length (valid)", labelRu:"Макс. длина (валид.)", isValid:true },
        { value: mx + 1, type:"max_invalid",   label:"Above max length", labelRu:"Больше макс. длины",  isValid:false },
      ];
    }

    const step = dataType === "float" ? 0.1 : 1;
    const nominal = parseFloat(((mn + mx) / 2).toFixed(1));

    return [
      { value: parseFloat((mn - step).toFixed(1)), type:"min_invalid",  label:"Below min",    labelRu:"Ниже минимума",     isValid:false },
      { value: mn,                                  type:"min_valid",    label:"Min (valid)",  labelRu:"Минимум (валид.)",   isValid:true  },
      { value: parseFloat((mn + step).toFixed(1)), type:"min_plus1",    label:"Min+1",        labelRu:"Минимум+1",          isValid:true  },
      { value: nominal,                             type:"nominal",      label:"Nominal",      labelRu:"Номинальный",        isValid:true  },
      { value: parseFloat((mx - step).toFixed(1)), type:"max_minus1",   label:"Max-1",        labelRu:"Максимум-1",         isValid:true  },
      { value: mx,                                  type:"max_valid",    label:"Max (valid)",  labelRu:"Максимум (валид.)",  isValid:true  },
      { value: parseFloat((mx + step).toFixed(1)), type:"max_invalid",  label:"Above max",    labelRu:"Выше максимума",     isValid:false },
    ];
  }, [min, max, dataType]);

  const csvOutput = results.map(r => `${r.isValid ? "Valid" : "Invalid"},${r.value},${isRu ? r.labelRu : r.label}`).join("\n");

  return (
    <div className="space-y-5 max-w-xl">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="input-label">{isRu ? "Минимум" : "Minimum"}</label>
          <input value={min} onChange={e => setMin(e.target.value)} type="number"
            className="code-surface w-full rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none" />
        </div>
        <div>
          <label className="input-label">{isRu ? "Максимум" : "Maximum"}</label>
          <input value={max} onChange={e => setMax(e.target.value)} type="number"
            className="code-surface w-full rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none" />
        </div>
      </div>

      <div>
        <label className="input-label">{isRu ? "Тип данных" : "Data type"}</label>
        <div className="flex gap-1 rounded border border-border overflow-hidden w-fit">
          {(["integer","float","string"] as const).map(t => (
            <button key={t} onClick={() => setDataType(t)}
              className={`px-3 py-1.5 text-xs transition-colors ${dataType === t ? "bg-accent text-accent-fg" : "bg-surface text-text-muted hover:bg-surface-hover"}`}>
              {t === "string" ? (isRu ? "Строка (длина)" : "String (length)") : t}
            </button>
          ))}
        </div>
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="input-label mb-0">{isRu ? "Граничные значения" : "Boundary values"}</label>
            <CopyButton value={csvOutput} />
          </div>
          <div className="space-y-1.5">
            {results.map((r, i) => (
              <div key={i} className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 ${r.isValid ? "border-green-800/30 bg-green-900/10" : "border-red-800/30 bg-red-900/10"}`}>
                <span className={`shrink-0 text-xs font-bold w-12 ${r.isValid ? "text-success" : "text-error"}`}>
                  {r.isValid ? (isRu ? "✓ ОК" : "✓ OK") : (isRu ? "✗ BAD" : "✗ BAD")}
                </span>
                <span className="font-mono text-sm font-semibold text-text-primary w-16 shrink-0">{r.value}</span>
                <span className="text-xs text-text-muted">{isRu ? r.labelRu : r.label}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-text-muted">
            {isRu ? "7 граничных значений для полного тестового покрытия" : "7 boundary values for complete test coverage"}
          </p>
        </div>
      )}
    </div>
  );
}