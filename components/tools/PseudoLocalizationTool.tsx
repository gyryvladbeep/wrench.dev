"use client";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { pseudoLocalize } from "@/lib/mobile/pseudo-locale";

const SAMPLE = "Save changes\nWelcome, %1$s!\nYou have {count} new messages\nPlease <b>confirm</b> your email";

export function PseudoLocalizationTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [input, setInput] = useState(SAMPLE);
  const [accents, setAccents] = useState(true);
  const [brackets, setBrackets] = useState(true);
  const [rtl, setRtl] = useState(false);
  const [expansion, setExpansion] = useState("30");

  const rows = useMemo(
    () => pseudoLocalize(input, { accents, brackets, rtl, expansion: Math.max(0, Math.min(300, Number(expansion) || 0)) }),
    [input, accents, brackets, rtl, expansion],
  );
  const output = rows.map((r) => r.text).join("\n");
  const totalPlaceholders = rows.reduce((n, r) => n + r.placeholders, 0);

  const check = (id: string, label: string, value: boolean, set: (v: boolean) => void) => (
    <label htmlFor={id} className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
      <input id={id} type="checkbox" checked={value} onChange={(e) => set(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--accent-rgb))]" />
      {label}
    </label>
  );

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <label htmlFor="pseudo-input" className="input-label">{isRu ? "Строки интерфейса (одна на строку)" : "UI strings (one per line)"}</label>
        <textarea id="pseudo-input" value={input} onChange={(e) => setInput(e.target.value)} rows={6} spellCheck={false}
          className="code-surface w-full rounded-lg px-3 py-2.5 font-mono text-sm text-text-primary outline-none" />
      </div>

      <div className="flex flex-wrap items-end gap-x-6 gap-y-3 rounded-lg border border-border bg-surface p-4">
        {check("pseudo-accents", isRu ? "Акценты вместо букв" : "Accented letters", accents, setAccents)}
        {check("pseudo-brackets", isRu ? "Скобки по краям [ ]" : "Edge brackets [ ]", brackets, setBrackets)}
        {check("pseudo-rtl", isRu ? "Направление справа налево (RTL)" : "Right-to-left override (RTL)", rtl, setRtl)}
        <div className="w-36">
          <label htmlFor="pseudo-expansion" className="input-label">{isRu ? "Удлинение, %" : "Expansion, %"}</label>
          <input id="pseudo-expansion" type="number" min="0" max="300" value={expansion} onChange={(e) => setExpansion(e.target.value)}
            className="code-surface w-full rounded-lg px-3 py-2 font-mono text-sm text-text-primary outline-none" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="input-label !mb-0">{isRu ? "Результат" : "Result"}</span>
          <CopyButton value={output} label={isRu ? "Копировать всё" : "Copy all"} />
        </div>
        <pre data-testid="pseudo-output" className="code-surface overflow-x-auto rounded-lg px-4 py-3 text-sm leading-relaxed text-text-primary whitespace-pre-wrap break-words">{output}</pre>
        <p className="text-xs text-text-muted" data-testid="pseudo-summary">
          {isRu
            ? `Строк: ${rows.length}. Сохранено подстановок и тегов без изменений: ${totalPlaceholders}.`
            : `Strings: ${rows.length}. Placeholders and tags kept untouched: ${totalPlaceholders}.`}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-text-muted">
              <th className="px-3 py-2 font-medium">{isRu ? "Оригинал" : "Original"}</th>
              <th className="px-3 py-2 font-medium">{isRu ? "Длина" : "Length"}</th>
              <th className="px-3 py-2 font-medium">{isRu ? "Рост" : "Growth"}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-border">
                <td className="px-3 py-2 font-mono text-text-muted">{r.original || "-"}</td>
                <td className="px-3 py-2 text-text-muted">{r.original.length} {"→"} {r.text.length}</td>
                <td className="px-3 py-2 text-text-primary">{r.original.length ? `+${r.growth}%` : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
