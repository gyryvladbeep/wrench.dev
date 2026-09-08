"use client";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace("#", "");
  const full  = clean.length === 3 ? clean.split("").map(c => c + c).join("") : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}

// WCAG relative luminance — https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
function srgbChannelToLinear(c: number): number {
  const cs = c / 255;
  return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
}

function relativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map(srgbChannelToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: [number, number, number], b: [number, number, number]): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker  = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const THRESHOLDS = [
  { key: "normalAA",  min: 4.5, labelEn: "Normal text — AA",  labelRu: "Обычный текст — AA" },
  { key: "normalAAA", min: 7.0, labelEn: "Normal text — AAA", labelRu: "Обычный текст — AAA" },
  { key: "largeAA",   min: 3.0, labelEn: "Large text — AA",   labelRu: "Крупный текст — AA" },
  { key: "largeAAA",  min: 4.5, labelEn: "Large text — AAA",  labelRu: "Крупный текст — AAA" },
] as const;

const PRESETS: { labelEn: string; labelRu: string; fg: string; bg: string }[] = [
  { labelEn: "Black on white", labelRu: "Чёрный на белом", fg: "#09090B", bg: "#FFFFFF" },
  { labelEn: "White on black", labelRu: "Белый на чёрном", fg: "#FFFFFF", bg: "#09090B" },
  { labelEn: "Gray on white",  labelRu: "Серый на белом",  fg: "#9CA3AF", bg: "#FFFFFF" },
  { labelEn: "Accent on dark", labelRu: "Акцент на тёмном", fg: "#F59E0B", bg: "#18181B" },
];

export function ContrastCheckerTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.common.copy === "Копировать";
  const [fg, setFg] = useState("#111827");
  const [bg, setBg] = useState("#FFFFFF");

  const fgRgb = useMemo(() => hexToRgb(fg), [fg]);
  const bgRgb = useMemo(() => hexToRgb(bg), [bg]);
  const fgValid = !!fgRgb;
  const bgValid = !!bgRgb;

  const ratio = useMemo(() => (fgRgb && bgRgb ? contrastRatio(fgRgb, bgRgb) : null), [fgRgb, bgRgb]);
  const ratioLabel = ratio !== null ? `${ratio.toFixed(2)}:1` : "—";

  function swap() {
    setFg(bg);
    setBg(fg);
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Color inputs */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
        <div className="flex gap-3 items-center flex-1">
          <input type="color" value={fgValid ? fg : "#000000"} onChange={e => setFg(e.target.value)}
            className="h-12 w-12 rounded-lg border border-border cursor-pointer bg-transparent" />
          <div className="flex-1">
            <label className="input-label">{isRu ? "Цвет текста" : "Foreground (text)"}</label>
            <input value={fg} onChange={e => setFg(e.target.value)} placeholder="#111827" spellCheck={false}
              className={`code-surface w-full rounded-lg px-3 py-2.5 font-mono text-sm text-text-primary outline-none ${!fgValid && fg ? "border-red-500/50" : ""}`} />
          </div>
        </div>

        <button onClick={swap} title={isRu ? "Поменять местами" : "Swap colors"}
          className="shrink-0 self-center rounded-lg border border-border bg-surface px-3 py-2.5 text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors">
          ⇄
        </button>

        <div className="flex gap-3 items-center flex-1">
          <input type="color" value={bgValid ? bg : "#FFFFFF"} onChange={e => setBg(e.target.value)}
            className="h-12 w-12 rounded-lg border border-border cursor-pointer bg-transparent" />
          <div className="flex-1">
            <label className="input-label">{isRu ? "Цвет фона" : "Background"}</label>
            <input value={bg} onChange={e => setBg(e.target.value)} placeholder="#FFFFFF" spellCheck={false}
              className={`code-surface w-full rounded-lg px-3 py-2.5 font-mono text-sm text-text-primary outline-none ${!bgValid && bg ? "border-red-500/50" : ""}`} />
          </div>
        </div>
      </div>

      {/* Live preview */}
      {fgValid && bgValid && (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="p-6 space-y-2" style={{ background: bg }}>
            <p style={{ color: fg, fontSize: "16px" }}>
              {isRu ? "Обычный текст 16px — так выглядит основной контент." : "Normal text at 16px — this is how body copy looks."}
            </p>
            <p style={{ color: fg, fontSize: "24px", fontWeight: 700 }}>
              {isRu ? "Крупный текст 24px" : "Large text at 24px"}
            </p>
          </div>
        </div>
      )}

      {/* Ratio */}
      {ratio !== null && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
          <span className="text-2xl font-mono font-semibold text-text-primary">{ratioLabel}</span>
          <span className="text-xs text-text-muted">{isRu ? "коэффициент контраста" : "contrast ratio"}</span>
          <span className="ml-auto"><CopyButton value={ratioLabel} iconOnly /></span>
        </div>
      )}

      {/* Pass/fail table */}
      {ratio !== null && (
        <div className="space-y-2">
          <label className="input-label">{isRu ? "Соответствие WCAG" : "WCAG compliance"}</label>
          {THRESHOLDS.map(t => {
            const pass = ratio >= t.min;
            return (
              <div key={t.key}
                className={`flex items-center justify-between rounded-lg border px-4 py-2.5 ${pass ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
                <span className="text-sm text-text-primary">{isRu ? t.labelRu : t.labelEn}</span>
                <span className={`text-xs font-medium ${pass ? "text-green-400" : "text-red-400"}`}>
                  {pass ? (isRu ? `Пройдено (мин. ${t.min})` : `Pass (min ${t.min})`) : (isRu ? `Не пройдено (мин. ${t.min})` : `Fail (min ${t.min})`)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Presets */}
      <div>
        <label className="input-label">{isRu ? "Примеры" : "Presets"}</label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button key={p.fg + p.bg} onClick={() => { setFg(p.fg); setBg(p.bg); }}
              className="flex items-center gap-1.5 rounded border border-border bg-surface px-2.5 py-1.5 text-xs text-text-muted hover:bg-surface-hover transition-colors">
              <span className="h-3 w-3 rounded-full border border-border/50" style={{ background: p.fg }} />
              <span className="h-3 w-3 rounded-full border border-border/50 -ml-2" style={{ background: p.bg }} />
              {isRu ? p.labelRu : p.labelEn}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
