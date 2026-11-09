"use client";
import { useEffect, useRef, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { btnClass, download, primaryBtn, Field, NumberField, Panel, inputClass } from "./messenger/ui";

const MAX_SIDE = 8192;
const MAX_PIXELS = 40_000_000;
const PRESETS: [string, number, number][] = [["1x1", 1, 1], ["16x16", 16, 16], ["1920x1080", 1920, 1080], ["4000x3000", 4000, 3000], ["100x4000", 100, 4000], ["4000x100", 4000, 100], ["8000x5000", 8000, 5000]];
const FORMATS = { png: "image/png", jpeg: "image/jpeg", webp: "image/webp" } as const;
type Format = keyof typeof FORMATS;

function render(canvas: HTMLCanvasElement, w: number, h: number, color: string, noise: boolean) {
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  if (noise) {
    const img = ctx.createImageData(w, h);
    const d = img.data;
    let a = 123456789;
    for (let i = 0; i < d.length; i += 4) {
      a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
      d[i] = a & 255; d[i + 1] = (a >>> 8) & 255; d[i + 2] = (a >>> 16) & 255; d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }
  ctx.strokeStyle = "#000";
  ctx.lineWidth = Math.max(1, Math.round(Math.min(w, h) / 100));
  ctx.strokeRect(0, 0, w, h);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, h); ctx.moveTo(w, 0); ctx.lineTo(0, h); ctx.stroke();
  const fs = Math.max(8, Math.min(w / 8, h / 4));
  ctx.font = `bold ${fs}px sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = "#000"; ctx.fillText(`${w}x${h}`, w / 2, h / 2);
}

export function TestImageGeneratorTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [w, setW] = useState("1920");
  const [h, setH] = useState("1080");
  const [fmt, setFmt] = useState<Format>("png");
  const [color, setColor] = useState("#8fb8de");
  const [noise, setNoise] = useState(false);
  const ref = useRef<HTMLCanvasElement>(null);

  const width = Math.floor(Number(w));
  const height = Math.floor(Number(h));
  const valid = width >= 1 && height >= 1 && width <= MAX_SIDE && height <= MAX_SIDE && width * height <= MAX_PIXELS;

  useEffect(() => {
    if (valid && ref.current && width * height <= 4_000_000) render(ref.current, width, height, color, noise);
  }, [valid, width, height, color, noise]);

  const save = () => {
    if (!valid) return;
    const c = document.createElement("canvas");
    render(c, width, height, color, noise);
    c.toBlob((b) => { if (b) download(`test-image-${width}x${height}.${fmt === "jpeg" ? "jpg" : fmt}`, b, FORMATS[fmt]); }, FORMATS[fmt], 0.92);
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(([label, pw, ph]) => <button key={label} type="button" className={btnClass} data-testid={`ti-preset-${label}`} onClick={() => { setW(String(pw)); setH(String(ph)); }}>{label}</button>)}
      </div>
      <Panel cols="sm:grid-cols-3">
        <NumberField id="ti-width" label={isRu ? "Ширина, px" : "Width, px"} value={w} onChange={setW} min={1} max={MAX_SIDE} />
        <NumberField id="ti-height" label={isRu ? "Высота, px" : "Height, px"} value={h} onChange={setH} min={1} max={MAX_SIDE} />
        <Field id="ti-format" label={isRu ? "Формат" : "Format"}>
          <select id="ti-format" value={fmt} onChange={(e) => setFmt(e.target.value as Format)} className={inputClass}>
            <option value="png">PNG</option><option value="jpeg">JPEG</option><option value="webp">WebP</option>
          </select>
        </Field>
        <Field id="ti-color" label={isRu ? "Цвет фона" : "Background color"}>
          <input id="ti-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-full rounded-lg" />
        </Field>
        <label className="flex items-center gap-2 text-sm text-text-secondary sm:col-span-2"><input id="ti-noise" type="checkbox" checked={noise} onChange={(e) => setNoise(e.target.checked)} /> {isRu ? "Шум (файл почти не сжимается и получается тяжёлым)" : "Noise (the file barely compresses and gets heavy)"}</label>
      </Panel>
      {!valid ? (
        <p className="text-sm text-amber-300" data-testid="ti-invalid">{isRu ? `Стороны от 1 до ${MAX_SIDE} px, площадь не больше 40 млн пикселей.` : `Sides from 1 to ${MAX_SIDE} px, area up to 40 million pixels.`}</p>
      ) : (
        <p className="text-sm text-text-muted" data-testid="ti-info">{width} x {height} px, {((width * height) / 1e6).toFixed(2)} MP</p>
      )}
      {valid && width * height > 4_000_000 ? <p className="text-xs text-text-muted">{isRu ? "Предпросмотр отключён для больших размеров, файл будет собран при скачивании." : "Preview is off for large sizes; the file is built when you download."}</p> : null}
      <canvas ref={ref} data-testid="ti-preview" className="max-h-64 w-auto max-w-full rounded-lg border border-border" />
      <button type="button" data-testid="ti-download" disabled={!valid} className={primaryBtn} onClick={save}>{isRu ? "Скачать изображение" : "Download image"}</button>
    </div>
  );
}
