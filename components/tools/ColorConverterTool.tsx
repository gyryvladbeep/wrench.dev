"use client";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

function hexToRgb(hex: string): [number,number,number] | null {
  const clean = hex.replace("#","");
  const full  = clean.length === 3 ? clean.split("").map(c=>c+c).join("") : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return [parseInt(full.slice(0,2),16), parseInt(full.slice(2,4),16), parseInt(full.slice(4,6),16)];
}

function rgbToHex(r:number,g:number,b:number) {
  return "#" + [r,g,b].map(v=>v.toString(16).padStart(2,"0")).join("").toUpperCase();
}

function rgbToHsl(r:number,g:number,b:number): [number,number,number] {
  r/=255; g/=255; b/=255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b), l=(max+min)/2;
  if (max===min) return [0,0,Math.round(l*100)];
  const d=max-min, s=l>0.5?d/(2-max-min):d/(max+min);
  let h = max===r?(g-b)/d+(g<b?6:0):max===g?(b-r)/d+2:(r-g)/d+4;
  return [Math.round(h*60), Math.round(s*100), Math.round(l*100)];
}

function rgbToHsv(r:number,g:number,b:number): [number,number,number] {
  r/=255; g/=255; b/=255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b), d=max-min;
  const v=max, s=max===0?0:d/max;
  let h=0;
  if (d!==0) h=max===r?(g-b)/d%(6):max===g?(b-r)/d+2:(r-g)/d+4;
  return [Math.round(h*60+360)%360, Math.round(s*100), Math.round(v*100)];
}

function hslToRgb(h:number,s:number,l:number): [number,number,number] {
  s/=100; l/=100;
  const a=s*Math.min(l,1-l);
  const f=(n:number)=>{ const k=(n+h/30)%12; return l-a*Math.max(Math.min(k-3,9-k,1),-1); };
  return [Math.round(f(0)*255),Math.round(f(8)*255),Math.round(f(4)*255)];
}

const PRESETS = [
  { label:"Amber",   hex:"#F59E0B" },
  { label:"Blue",    hex:"#3B82F6" },
  { label:"Green",   hex:"#22C55E" },
  { label:"Red",     hex:"#EF4444" },
  { label:"Violet",  hex:"#8B5CF6" },
  { label:"Cyan",    hex:"#06B6D4" },
  { label:"White",   hex:"#FFFFFF" },
  { label:"Black",   hex:"#09090B" },
];

export function ColorConverterTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.common.copy === "Копировать";
  const [hex, setHex] = useState("#F59E0B");

  const rgb = useMemo(() => hexToRgb(hex), [hex]);
  const hsl = useMemo(() => rgb ? rgbToHsl(...rgb) : null, [rgb]);
  const hsv = useMemo(() => rgb ? rgbToHsv(...rgb) : null, [rgb]);

  const valid = !!rgb;

  const formats = rgb && hsl && hsv ? [
    { label:"HEX",  value: hex.toUpperCase() },
    { label:"RGB",  value: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})` },
    { label:"RGBA", value: `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 1)` },
    { label:"HSL",  value: `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)` },
    { label:"HSV",  value: `hsv(${hsv[0]}, ${hsv[1]}%, ${hsv[2]}%)` },
    { label:"Tailwind approx", value: `text-[${hex.toUpperCase()}]` },
  ] : [];

  return (
    <div className="space-y-5 max-w-lg">
      {/* Color picker + hex input */}
      <div className="flex gap-3 items-center">
        <input type="color" value={valid ? hex : "#000000"} onChange={e => setHex(e.target.value)}
          className="h-12 w-12 rounded-lg border border-border cursor-pointer bg-transparent" />
        <div className="flex-1">
          <label className="input-label">{isRu ? "HEX цвет" : "HEX color"}</label>
          <input value={hex} onChange={e => setHex(e.target.value)} placeholder="#F59E0B" spellCheck={false}
            className={`code-surface w-full rounded-lg px-3 py-2.5 font-mono text-sm text-text-primary outline-none ${!valid && hex ? "border-red-500/50" : ""}`} />
        </div>
      </div>

      {/* Preview */}
      {valid && (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="h-20 w-full" style={{ background: hex }} />
          <div className="flex">
            <div className="flex-1 h-10" style={{ background: `rgb(${rgb![0]},0,0)` }} />
            <div className="flex-1 h-10" style={{ background: `rgb(0,${rgb![1]},0)` }} />
            <div className="flex-1 h-10" style={{ background: `rgb(0,0,${rgb![2]})` }} />
          </div>
        </div>
      )}

      {/* Presets */}
      <div>
        <label className="input-label">{isRu ? "Быстрый выбор" : "Presets"}</label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button key={p.hex} onClick={() => setHex(p.hex)}
              className="flex items-center gap-1.5 rounded border border-border bg-surface px-2.5 py-1.5 text-xs text-text-muted hover:bg-surface-hover transition-colors">
              <span className="h-3 w-3 rounded-full border border-border/50" style={{ background: p.hex }} />
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Formats */}
      {formats.length > 0 && (
        <div className="space-y-2">
          <label className="input-label">{isRu ? "Форматы" : "Formats"}</label>
          {formats.map(f => (
            <div key={f.label} className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-2.5">
              <span className="w-24 shrink-0 text-xs text-text-muted">{f.label}</span>
              <span className="flex-1 font-mono text-sm text-text-primary">{f.value}</span>
              <CopyButton value={f.value} iconOnly />
            </div>
          ))}
        </div>
      )}

      {/* RGB sliders */}
      {rgb && (
        <div className="space-y-3">
          <label className="input-label">{isRu ? "RGB слайдеры" : "RGB sliders"}</label>
          {[["R", rgb[0], "255,0,0"], ["G", rgb[1], "0,255,0"], ["B", rgb[2], "0,0,255"]].map(([ch, val, color]) => (
            <div key={ch as string} className="flex items-center gap-3">
              <span className="w-4 text-xs font-mono text-text-muted">{ch}</span>
              <input type="range" min={0} max={255} value={val as number}
                onChange={e => {
                  const v = Number(e.target.value);
                  const newRgb: [number,number,number] = [...rgb] as [number,number,number];
                  if (ch==="R") newRgb[0]=v; else if (ch==="G") newRgb[1]=v; else newRgb[2]=v;
                  setHex(rgbToHex(...newRgb));
                }}
                className="flex-1 accent-accent" />
              <span className="w-8 text-right text-xs font-mono text-text-muted">{val as number}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}