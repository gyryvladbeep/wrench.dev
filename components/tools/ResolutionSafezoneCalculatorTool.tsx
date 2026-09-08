"use client";
import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";

interface Preset { id: string; name: string; aw: number; ah: number; }

let nextId = 0;
function newPreset(name: string, aw: number, ah: number): Preset {
  nextId += 1;
  return { id: `preset-${nextId}`, name, aw, ah };
}

const DEFAULT_PRESETS: Preset[] = [
  newPreset("Desktop 16:9", 16, 9),
  newPreset("Ultrawide 21:9", 21, 9),
  newPreset("Classic 4:3", 4, 3),
  newPreset("Mobile Portrait 9:16", 9, 16),
  newPreset("Mobile Wide 19.5:9", 19.5, 9),
  newPreset("Handheld 16:10", 16, 10),
];

function round(n: number): number {
  return Math.round(n);
}

export function ResolutionSafezoneCalculatorTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.common.copy === "Копировать";
  const [refWidth, setRefWidth]   = useState(1920);
  const [marginPct, setMarginPct] = useState(5);
  const [presets, setPresets]     = useState<Preset[]>(DEFAULT_PRESETS);

  const rows = useMemo(() => {
    const m = Math.max(0, Math.min(49, marginPct)) / 100;
    return presets.map(p => {
      const width  = refWidth;
      const height = refWidth * (p.ah / p.aw);
      const safeW  = width  * (1 - 2 * m);
      const safeH  = height * (1 - 2 * m);
      const insetX = width  * m;
      const insetY = height * m;
      return { ...p, width, height, safeW, safeH, insetX, insetY };
    });
  }, [presets, refWidth, marginPct]);

  function updatePreset(id: string, patch: Partial<Preset>) {
    setPresets(ps => ps.map(p => (p.id === id ? { ...p, ...patch } : p)));
  }

  function addPreset() {
    setPresets(ps => [...ps, newPreset(isRu ? "Своё соотношение" : "Custom ratio", 16, 9)]);
  }

  function removePreset(id: string) {
    setPresets(ps => ps.filter(p => p.id !== id));
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="input-label">{isRu ? "Базовая ширина" : "Reference width"}</label>
          <input type="number" min={1} value={refWidth} onChange={e => setRefWidth(Number(e.target.value))}
            className="code-surface w-32 rounded-lg px-3 py-2 font-mono text-sm text-text-primary outline-none" />
        </div>
        <div>
          <label className="input-label">{isRu ? "Отступ safe zone, %" : "Safe zone margin, %"}</label>
          <input type="number" min={0} max={49} value={marginPct} onChange={e => setMarginPct(Number(e.target.value))}
            className="code-surface w-28 rounded-lg px-3 py-2 font-mono text-sm text-text-primary outline-none" />
        </div>
      </div>

      <div className="space-y-3">
        {rows.map(r => (
          <div key={r.id} className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-surface p-3">
            {/* Scaled preview */}
            <div className="relative shrink-0 border border-border/70 bg-canvas" style={{ width: 120, height: 120 * (r.ah / r.aw) }}>
              <div className="absolute border border-dashed border-accent/60"
                style={{
                  left: `${(r.insetX / r.width) * 100}%`,
                  top: `${(r.insetY / r.height) * 100}%`,
                  right: `${(r.insetX / r.width) * 100}%`,
                  bottom: `${(r.insetY / r.height) * 100}%`,
                }} />
            </div>

            <div className="flex-1 min-w-[180px]">
              <input value={r.name} onChange={e => updatePreset(r.id, { name: e.target.value })}
                className="code-surface w-full rounded-lg px-3 py-1.5 text-sm text-text-primary outline-none mb-1.5" />
              <div className="flex gap-2">
                <input type="number" value={r.aw} onChange={e => updatePreset(r.id, { aw: Number(e.target.value) })}
                  className="code-surface w-16 rounded px-2 py-1 font-mono text-xs text-text-primary outline-none" />
                <span className="text-text-muted text-xs self-center">:</span>
                <input type="number" value={r.ah} onChange={e => updatePreset(r.id, { ah: Number(e.target.value) })}
                  className="code-surface w-16 rounded px-2 py-1 font-mono text-xs text-text-primary outline-none" />
              </div>
            </div>

            <div className="font-mono text-xs text-text-muted space-y-0.5">
              <div>{isRu ? "Кадр" : "Frame"}: {round(r.width)}×{round(r.height)}</div>
              <div>Safe zone: {round(r.safeW)}×{round(r.safeH)}</div>
              <div>{isRu ? "Отступ" : "Inset"}: {round(r.insetX)}×{round(r.insetY)}px</div>
            </div>

            <button onClick={() => removePreset(r.id)} title={isRu ? "Удалить" : "Remove"}
              className="ml-auto shrink-0 rounded-lg border border-border bg-surface px-2.5 py-2 text-text-muted hover:bg-surface-hover hover:text-red-400 transition-colors">
              ✕
            </button>
          </div>
        ))}
        <button onClick={addPreset}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors">
          + {isRu ? "Добавить соотношение" : "Add ratio"}
        </button>
      </div>
    </div>
  );
}
