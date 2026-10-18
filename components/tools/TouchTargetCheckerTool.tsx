"use client";
import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { RULES, checkTarget, round1, toLogical } from "@/lib/mobile/touch-targets";

const inputClass = "code-surface w-full rounded-lg px-3 py-2.5 font-mono text-sm text-text-primary outline-none";

export function TouchTargetCheckerTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [w, setW] = useState("40");
  const [h, setH] = useState("40");
  const [gap, setGap] = useState("8");
  const [unit, setUnit] = useState<"logical" | "px">("logical");
  const [scale, setScale] = useState("3");

  const sc = Number(scale);
  const width = toLogical(Number(w), unit, sc);
  const height = toLogical(Number(h), unit, sc);
  const gp = toLogical(Number(gap), unit, sc);
  const valid = Number.isFinite(width) && Number.isFinite(height) && Number.isFinite(gp) && width > 0 && height > 0 && gp >= 0;
  const results = useMemo(() => (valid ? checkTarget({ width, height, gap: gp }) : []), [valid, width, height, gp]);

  const field = (id: string, label: string, value: string, set: (v: string) => void) => (
    <div>
      <label htmlFor={id} className="input-label">{label}</label>
      <input id={id} type="number" min="0" step="any" value={value} onChange={(e) => set(e.target.value)} className={inputClass} />
    </div>
  );

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="grid gap-3 rounded-lg border border-border bg-surface p-4 sm:grid-cols-3">
        {field("tt-width", isRu ? "Ширина области нажатия" : "Tap area width", w, setW)}
        {field("tt-height", isRu ? "Высота области нажатия" : "Tap area height", h, setH)}
        {field("tt-gap", isRu ? "Расстояние до соседней цели" : "Gap to the neighbouring target", gap, setGap)}
        <div>
          <label htmlFor="tt-unit" className="input-label">{isRu ? "Единицы" : "Units"}</label>
          <select id="tt-unit" value={unit} onChange={(e) => setUnit(e.target.value as "logical" | "px")} className={inputClass}>
            <option value="logical">{isRu ? "dp / pt / CSS px" : "dp / pt / CSS px"}</option>
            <option value="px">{isRu ? "Физические пиксели" : "Physical pixels"}</option>
          </select>
        </div>
        {unit === "px" && field("tt-scale", isRu ? "Масштаб плотности (3 для xxhdpi и @3x)" : "Density scale (3 for xxhdpi and @3x)", scale, setScale)}
      </div>

      {!valid ? (
        <p className="text-sm text-text-muted" data-testid="tt-invalid">{isRu ? "Введите положительные размеры и масштаб." : "Enter positive sizes and a density scale."}</p>
      ) : (
        <>
          <p className="text-sm text-text-muted" data-testid="tt-summary">
            {isRu ? "Размер в логических единицах" : "Size in logical units"}: {round1(width)} × {round1(height)}
            {" · "}{isRu ? "расстояние" : "gap"}: {round1(gp)}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-text-muted">
                  <th className="px-3 py-2 font-medium">{isRu ? "Правило" : "Rule"}</th>
                  <th className="px-3 py-2 font-medium">{isRu ? "Минимум" : "Minimum"}</th>
                  <th className="px-3 py-2 font-medium">{isRu ? "Результат" : "Result"}</th>
                  <th className="px-3 py-2 font-medium">{isRu ? "Что исправить" : "How to fix"}</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.rule.id} className="border-t border-border" data-testid={`tt-${r.rule.id}`} data-pass={r.pass ? "true" : "false"}>
                    <td className="px-3 py-2 text-text-primary">{isRu ? r.rule.labelRu : r.rule.label}</td>
                    <td className="px-3 py-2 font-mono text-text-muted">{r.rule.min} × {r.rule.min} {r.rule.unit}</td>
                    <td className={`px-3 py-2 font-medium ${r.pass ? "text-green-400" : "text-red-400"}`}>
                      {r.pass ? (r.viaSpacing ? (isRu ? "Проходит по расстоянию" : "Passes by spacing") : (isRu ? "Проходит" : "Pass")) : (isRu ? "Не проходит" : "Fail")}
                    </td>
                    <td className="px-3 py-2 text-text-muted">
                      {r.pass ? "-" : (isRu ? `добавьте по ${r.paddingPerSide} с каждой стороны меньшей стороны (не хватает ${r.shortfall})` : `add ${r.paddingPerSide} padding on each side of the shorter side (short by ${r.shortfall})`)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <p className="text-xs text-text-muted">
        {isRu
          ? "Проверяется область нажатия, а не нарисованная иконка: иконку можно оставить маленькой, добавив невидимый отступ. dp, pt и CSS px сравниваются как равные логические единицы. Исключение WCAG по расстоянию считается для соседней цели того же размера."
          : "This checks the tappable area, not the drawn icon: keep the icon small and add invisible padding. dp, pt and CSS px are compared as equal logical units. The WCAG spacing exception assumes a neighbouring target of the same size."}
      </p>
    </div>
  );
}
