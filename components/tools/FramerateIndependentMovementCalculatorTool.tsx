"use client";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

const TARGET_FPS = [30, 60, 90, 120, 144] as const;

function fmt(n: number, digits = 4): string {
  return Number.isFinite(n) ? n.toFixed(digits) : "—";
}

export function FramerateIndependentMovementCalculatorTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.common.copy === "Копировать";

  // ── Speed converter ────────────────────────────────────────────────────
  const [speedValue, setSpeedValue] = useState(2);
  const [speedFps, setSpeedFps]     = useState(60);

  const perSecond = useMemo(() => speedValue * (speedFps || 1), [speedValue, speedFps]);
  const speedRows = useMemo(
    () => TARGET_FPS.map(fps => ({ fps, perFrame: perSecond / fps })),
    [perSecond]
  );

  // ── Exponential smoothing (lerp) factor ────────────────────────────────
  const [halfLife, setHalfLife] = useState(0.15);

  const lerpRows = useMemo(
    () => TARGET_FPS.map(fps => {
      const dt = 1 / fps;
      const factor = halfLife > 0 ? 1 - Math.pow(0.5, dt / halfLife) : 1;
      return { fps, dt, factor };
    }),
    [halfLife]
  );

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Speed converter */}
      <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
        <label className="input-label">{isRu ? "Конвертер скорости за кадр" : "Per-frame speed converter"}</label>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="input-label">{isRu ? "Скорость (за кадр)" : "Speed (per frame)"}</label>
            <input type="number" step="0.01" value={speedValue} onChange={e => setSpeedValue(Number(e.target.value))}
              className="code-surface w-32 rounded-lg px-3 py-2 font-mono text-sm text-text-primary outline-none" />
          </div>
          <div>
            <label className="input-label">{isRu ? "Настроено при FPS" : "Tuned at FPS"}</label>
            <input type="number" value={speedFps} onChange={e => setSpeedFps(Number(e.target.value))}
              className="code-surface w-24 rounded-lg px-3 py-2 font-mono text-sm text-text-primary outline-none" />
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-canvas px-3 py-2">
            <span className="font-mono text-sm text-text-primary">{fmt(perSecond, 2)} {isRu ? "/сек" : "/sec"}</span>
            <CopyButton value={fmt(perSecond, 2)} iconOnly />
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-text-muted">
              <th className="py-1.5 font-normal">FPS</th>
              <th className="py-1.5 font-normal">{isRu ? "Скорость за кадр" : "Per-frame speed"}</th>
            </tr>
          </thead>
          <tbody>
            {speedRows.map(r => (
              <tr key={r.fps} className="border-t border-border/60">
                <td className="py-1.5 font-mono text-text-primary">{r.fps}</td>
                <td className="py-1.5 font-mono text-text-primary">{fmt(r.perFrame, 4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-text-muted font-mono">perSecond = speed * tunedFps; perFrame(fps) = perSecond / fps</p>
      </div>

      {/* Lerp / smoothing factor */}
      <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
        <label className="input-label">{isRu ? "Коэффициент экспоненциального сглаживания" : "Exponential smoothing (lerp) factor"}</label>
        <div>
          <label className="input-label">{isRu ? "Half-life, сек (время схождения половины расстояния)" : "Half-life, seconds (time to close half the distance)"}</label>
          <input type="number" step="0.01" value={halfLife} onChange={e => setHalfLife(Number(e.target.value))}
            className="code-surface w-40 rounded-lg px-3 py-2 font-mono text-sm text-text-primary outline-none" />
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-text-muted">
              <th className="py-1.5 font-normal">FPS</th>
              <th className="py-1.5 font-normal">deltaTime</th>
              <th className="py-1.5 font-normal">{isRu ? "Коэффициент за кадр" : "Per-frame factor"}</th>
            </tr>
          </thead>
          <tbody>
            {lerpRows.map(r => (
              <tr key={r.fps} className="border-t border-border/60">
                <td className="py-1.5 font-mono text-text-primary">{r.fps}</td>
                <td className="py-1.5 font-mono text-text-muted">{fmt(r.dt, 4)}</td>
                <td className="py-1.5 font-mono text-text-primary flex items-center gap-2">
                  {fmt(r.factor, 4)}
                  <CopyButton value={fmt(r.factor, 4)} iconOnly />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-text-muted font-mono">factor(deltaTime) = 1 - 0.5^(deltaTime / halfLife)</p>
        <p className="text-xs text-text-muted">
          {isRu
            ? "Используйте так: pos = lerp(pos, target, factor), где factor берётся из этой таблицы для текущего deltaTime — тогда сглаживание сходится с одинаковой реальной скоростью на любом FPS."
            : "Use it as: pos = lerp(pos, target, factor), where factor comes from this table for the current deltaTime — smoothing then converges at the same real-world speed regardless of frame rate."}
        </p>
      </div>
    </div>
  );
}
