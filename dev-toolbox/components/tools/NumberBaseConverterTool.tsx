"use client";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

const BASES = [
  { label:"Binary",      base:2,  prefix:"0b", chars:"0-1" },
  { label:"Octal",       base:8,  prefix:"0o", chars:"0-7" },
  { label:"Decimal",     base:10, prefix:"",   chars:"0-9" },
  { label:"Hexadecimal", base:16, prefix:"0x", chars:"0-9A-F" },
];

export function NumberBaseConverterTool({ dict }: { dict: Dictionary }) {
  const [input,    setInput]   = useState("255");
  const [inputBase, setBase]   = useState(10);
  const isRu = dict.common.copy === "Копировать";

  const result = useMemo(() => {
    if (!input.trim()) return null;
    try {
      const decimal = parseInt(input.trim(), inputBase);
      if (isNaN(decimal)) return { error: isRu ? "Неверный ввод для этого основания" : "Invalid input for this base" };
      return {
        binary:  decimal.toString(2),
        octal:   decimal.toString(8),
        decimal: decimal.toString(10),
        hex:     decimal.toString(16).toUpperCase(),
        decimal_val: decimal,
      };
    } catch { return { error: isRu ? "Ошибка преобразования" : "Conversion error" }; }
  }, [input, inputBase, isRu]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="input-label">{isRu ? "Входное число" : "Input number"}</label>
          <input value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false}
            className="code-surface w-full rounded-[10px] px-3 py-2.5 font-mono text-lg text-text-primary outline-none" />
        </div>
        <div>
          <label className="input-label">{isRu ? "Основание входа" : "Input base"}</label>
          <div className="flex gap-2">
            {BASES.map((b) => (
              <button key={b.base} onClick={() => setBase(b.base)}
                className={`flex-1 rounded-[8px] py-2 text-xs transition-colors ${inputBase === b.base ? "bg-accent text-accent-fg" : "bg-surface border border-border text-text-muted hover:bg-surface-hover"}`}>
                {b.base}<span className="block text-[9px] opacity-70">{b.label.slice(0,3)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {result && "error" in result ? (
        <div className="text-sm text-red-400">{result.error}</div>
      ) : result ? (
        <div className="space-y-2">
          {[
            { label:"Binary (base 2)",      value:result.binary,  prefix:"0b" },
            { label:"Octal (base 8)",       value:result.octal,   prefix:"0o" },
            { label:"Decimal (base 10)",    value:result.decimal, prefix:"" },
            { label:"Hexadecimal (base 16)",value:result.hex,     prefix:"0x" },
          ].map(({ label, value, prefix }) => (
            <div key={label} className={`flex items-center justify-between rounded-[10px] border px-4 py-3 transition-colors ${inputBase === BASES.find(b=>b.prefix===prefix||(!prefix&&b.base===10))?.base ? "border-accent/30 bg-accent/5" : "border-border bg-surface"}`}>
              <div>
                <p className="text-xs text-text-muted">{label}</p>
                <p className="font-mono text-base text-text-primary mt-0.5">
                  {prefix && <span className="text-text-muted">{prefix}</span>}{value}
                </p>
              </div>
              <CopyButton value={value} iconOnly />
            </div>
          ))}
          <p className="text-xs text-text-muted pt-1">
            {isRu ? `Десятичное значение: ${result.decimal_val}` : `Decimal value: ${result.decimal_val}`}
          </p>
        </div>
      ) : null}
    </div>
  );
}
