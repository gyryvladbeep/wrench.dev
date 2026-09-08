"use client";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

type Mode = "orthogonal" | "isometric";

function gridToScreen(col: number, row: number, tw: number, th: number, mode: Mode): [number, number] {
  if (mode === "orthogonal") return [col * tw, row * th];
  return [(col - row) * (tw / 2), (col + row) * (th / 2)];
}

function screenToGrid(x: number, y: number, tw: number, th: number, mode: Mode): [number, number] {
  if (mode === "orthogonal") return [x / tw, y / th];
  const a = x / (tw / 2);
  const b = y / (th / 2);
  return [(a + b) / 2, (b - a) / 2];
}

function fmt(n: number): string {
  return Number.isFinite(n) ? (Math.round(n * 1000) / 1000).toString() : "—";
}

export function TilemapCoordinateConverterTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.common.copy === "Копировать";
  const [tileWidth, setTileWidth]   = useState(64);
  const [tileHeight, setTileHeight] = useState(32);
  const [mode, setMode] = useState<Mode>("isometric");

  const [col, setCol] = useState(3);
  const [row, setRow] = useState(2);
  const [screenX, setScreenX] = useState(64);
  const [screenY, setScreenY] = useState(80);

  const tw = tileWidth || 1;
  const th = tileHeight || 1;

  const g2s = useMemo(() => gridToScreen(col, row, tw, th, mode), [col, row, tw, th, mode]);
  const s2g = useMemo(() => screenToGrid(screenX, screenY, tw, th, mode), [screenX, screenY, tw, th, mode]);

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Tile size + mode */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="input-label">{isRu ? "Ширина тайла" : "Tile width"}</label>
          <input type="number" value={tileWidth} onChange={e => setTileWidth(Number(e.target.value))}
            className="code-surface w-28 rounded-lg px-3 py-2.5 font-mono text-sm text-text-primary outline-none" />
        </div>
        <div>
          <label className="input-label">{isRu ? "Высота тайла" : "Tile height"}</label>
          <input type="number" value={tileHeight} onChange={e => setTileHeight(Number(e.target.value))}
            className="code-surface w-28 rounded-lg px-3 py-2.5 font-mono text-sm text-text-primary outline-none" />
        </div>
        <div className="flex gap-1.5">
          {(["orthogonal", "isometric"] as Mode[]).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`rounded-lg border px-3 py-2.5 text-sm transition-colors ${mode === m ? "border-accent/50 bg-accent/10 text-accent" : "border-border bg-surface text-text-muted hover:bg-surface-hover"}`}>
              {m === "orthogonal" ? (isRu ? "Обычный" : "Orthogonal") : (isRu ? "Изометрия" : "Isometric")}
            </button>
          ))}
        </div>
      </div>

      {/* Grid -> Screen */}
      <div className="space-y-2 rounded-lg border border-border bg-surface p-4">
        <label className="input-label">{isRu ? "Сетка → Экран" : "Grid → Screen"}</label>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="input-label">{isRu ? "Столбец" : "Column"}</label>
            <input type="number" value={col} onChange={e => setCol(Number(e.target.value))}
              className="code-surface w-24 rounded-lg px-3 py-2 font-mono text-sm text-text-primary outline-none" />
          </div>
          <div>
            <label className="input-label">{isRu ? "Строка" : "Row"}</label>
            <input type="number" value={row} onChange={e => setRow(Number(e.target.value))}
              className="code-surface w-24 rounded-lg px-3 py-2 font-mono text-sm text-text-primary outline-none" />
          </div>
          <span className="text-text-muted pb-2">→</span>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-canvas px-3 py-2">
            <span className="font-mono text-sm text-text-primary">x: {fmt(g2s[0])}, y: {fmt(g2s[1])}</span>
            <CopyButton value={`${fmt(g2s[0])}, ${fmt(g2s[1])}`} iconOnly />
          </div>
        </div>
        <p className="text-xs text-text-muted font-mono">
          {mode === "orthogonal"
            ? "x = col * tileWidth; y = row * tileHeight"
            : "x = (col - row) * (tileWidth / 2); y = (col + row) * (tileHeight / 2)"}
        </p>
      </div>

      {/* Screen -> Grid */}
      <div className="space-y-2 rounded-lg border border-border bg-surface p-4">
        <label className="input-label">{isRu ? "Экран → Сетка" : "Screen → Grid"}</label>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="input-label">{isRu ? "Экран X" : "Screen X"}</label>
            <input type="number" value={screenX} onChange={e => setScreenX(Number(e.target.value))}
              className="code-surface w-24 rounded-lg px-3 py-2 font-mono text-sm text-text-primary outline-none" />
          </div>
          <div>
            <label className="input-label">{isRu ? "Экран Y" : "Screen Y"}</label>
            <input type="number" value={screenY} onChange={e => setScreenY(Number(e.target.value))}
              className="code-surface w-24 rounded-lg px-3 py-2 font-mono text-sm text-text-primary outline-none" />
          </div>
          <span className="text-text-muted pb-2">→</span>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-canvas px-3 py-2">
            <span className="font-mono text-sm text-text-primary">col: {fmt(s2g[0])}, row: {fmt(s2g[1])}</span>
            <CopyButton value={`${fmt(s2g[0])}, ${fmt(s2g[1])}`} iconOnly />
          </div>
        </div>
        <p className="text-xs text-text-muted font-mono">
          {mode === "orthogonal"
            ? "col = x / tileWidth; row = y / tileHeight"
            : "col = (x / (tileWidth/2) + y / (tileHeight/2)) / 2; row = (y / (tileHeight/2) - x / (tileWidth/2)) / 2"}
        </p>
      </div>
    </div>
  );
}
