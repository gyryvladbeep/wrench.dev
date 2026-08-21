"use client";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

const BASES = [
  { label:"Binary",       labelRu:"Двоичная",        base:2,  prefix:"0b" },
  { label:"Octal",        labelRu:"Восьмеричная",     base:8,  prefix:"0o" },
  { label:"Decimal",      labelRu:"Десятичная",       base:10, prefix:""   },
  { label:"Hexadecimal",  labelRu:"Шестнадцатеричная",base:16, prefix:"0x" },
];

export function NumberBaseConverterTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.common.copy === "Копировать";
  const [input,    setInput]    = useState("255");
  const [fromBase, setFromBase] = useState(10);

  const decimal = useMemo(() => {
    const v = parseInt(input.replace(/^0[bBoOxX]/, ""), fromBase);
    return isNaN(v) ? null : v;
  }, [input, fromBase]);

  const conversions = useMemo(() => {
    if (decimal === null) return [];
    return BASES.map(b => ({
      ...b,
      value:   decimal.toString(b.base).toUpperCase(),
      withPfx: b.prefix + decimal.toString(b.base).toUpperCase(),
    }));
  }, [decimal]);

  // Bit pattern visualization
  const bits = useMemo(() => {
    if (decimal === null || decimal < 0) return [];
    const bin = decimal.toString(2).padStart(Math.max(8, Math.ceil(decimal.toString(2).length / 8) * 8), "0");
    return bin.split("");
  }, [decimal]);

  const PRESETS = [255, 256, 1024, 65535, 16777215];

  return (
    <div className="space-y-5 max-w-lg">
      {/* Input */}
      <div>
        <label className="input-label">{isRu ? "Входное число" : "Input number"}</label>
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} spellCheck={false}
            placeholder="255"
            className="code-surface flex-1 rounded-lg px-3 py-2.5 font-mono text-lg text-text-primary outline-none" />
          <select value={fromBase} onChange={e => setFromBase(Number(e.target.value))}
            className="code-surface rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none">
            {BASES.map(b => (
              <option key={b.base} value={b.base}>{isRu ? b.labelRu : b.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map(p => (
          <button key={p} onClick={() => { setInput(String(p)); setFromBase(10); }}
            className="rounded border border-border bg-surface px-2.5 py-1 font-mono text-xs text-text-muted hover:bg-surface-hover transition-colors">
            {p}
          </button>
        ))}
      </div>

      {/* Error */}
      {input && decimal === null && (
        <div className="rounded-lg border border-red-800/30 bg-red-900/10 px-4 py-2.5 text-sm text-red-400">
          {isRu ? "Невалидное число для выбранной системы счисления" : "Invalid number for selected base"}
        </div>
      )}

      {/* Conversions */}
      {conversions.length > 0 && (
        <div className="space-y-2">
          <label className="input-label">{isRu ? "Результаты конвертации" : "Conversion results"}</label>
          {conversions.map(c => (
            <div key={c.base} className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${c.base === fromBase ? "border-accent/30 bg-accent/5" : "border-border bg-surface"}`}>
              <div className="w-36 shrink-0">
                <p className="text-xs text-text-muted">{isRu ? c.labelRu : c.label}</p>
                <p className="text-[10px] text-text-disabled">{isRu ? `Основание ${c.base}` : `Base ${c.base}`}</p>
              </div>
              <span className="flex-1 font-mono text-sm font-semibold text-text-primary break-all">{c.withPfx || c.value}</span>
              <CopyButton value={c.value} iconOnly />
            </div>
          ))}
        </div>
      )}

      {/* Bit visualization */}
      {bits.length > 0 && decimal! <= 0xFFFF && (
        <div>
          <label className="input-label">{isRu ? "Битовое представление" : "Bit pattern"}</label>
          <div className="flex flex-wrap gap-1">
            {bits.map((bit, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className={`flex h-7 w-7 items-center justify-center rounded border font-mono text-xs font-bold ${bit === "1" ? "border-accent/40 bg-accent/20 text-accent" : "border-border bg-surface text-text-disabled"}`}>
                  {bit}
                </span>
                {(i + 1) % 8 === 0 && i !== bits.length - 1 && <div className="w-2" />}
              </div>
            ))}
          </div>
          <p className="mt-1 text-xs text-text-muted">{bits.length} {isRu ? "бит" : "bits"} · {decimal} {isRu ? "в десятичной" : "decimal"}</p>
        </div>
      )}
    </div>
  );
}