"use client";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

function hexToRgb(hex: string): [number,number,number]|null {
  const m = hex.replace("#","").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  return [parseInt(m[1],16),parseInt(m[2],16),parseInt(m[3],16)];
}
function rgbToHex(r:number,g:number,b:number){return "#"+[r,g,b].map(v=>v.toString(16).padStart(2,"0")).join("");}
function rgbToHsl(r:number,g:number,b:number):[number,number,number]{
  r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b);let h=0,s=0;const l=(max+min)/2;
  if(max!==min){const d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);
    switch(max){case r:h=((g-b)/d+(g<b?6:0))/6;break;case g:h=((b-r)/d+2)/6;break;case b:h=((r-g)/d+4)/6;break;}}
  return[Math.round(h*360),Math.round(s*100),Math.round(l*100)];
}
function hslToRgb(h:number,s:number,l:number):[number,number,number]{
  s/=100;l/=100;const k=(n:number)=>(n+h/30)%12;const a=s*Math.min(l,1-l);
  const f=(n:number)=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));
  return[Math.round(f(0)*255),Math.round(f(8)*255),Math.round(f(4)*255)];
}

const CSS_COLORS: Record<string,[number,number,number]> = {
  red:[255,0,0],green:[0,128,0],blue:[0,0,255],white:[255,255,255],black:[0,0,0],
  yellow:[255,255,0],orange:[255,165,0],purple:[128,0,128],pink:[255,192,203],
  cyan:[0,255,255],magenta:[255,0,255],lime:[0,255,0],navy:[0,0,128],gray:[128,128,128],
};

export function ColorConverterTool({ dict }: { dict: Dictionary }) {
  const [hex, setHex]       = useState("#F0A23A");
  const [rgbInput, setRgb]  = useState("240, 162, 58");
  const [hslInput, setHsl]  = useState("36, 85%, 58%");
  const [cssInput, setCss]  = useState("");
  const [activeField, setActive] = useState<"hex"|"rgb"|"hsl"|"css">("hex");
  const isRu = dict.common.copy === "Копировать";

  const colors = useMemo(() => {
    try {
      let r=0,g=0,b=0;
      if (activeField === "hex") {
        const rgb = hexToRgb(hex); if (!rgb) return null; [r,g,b]=rgb;
      } else if (activeField === "rgb") {
        const parts = rgbInput.split(",").map(s=>parseInt(s.trim()));
        if (parts.length<3||parts.some(isNaN)) return null; [r,g,b]=parts;
      } else if (activeField === "hsl") {
        const parts = hslInput.replace(/%/g,"").split(",").map(s=>parseFloat(s.trim()));
        if (parts.length<3||parts.some(isNaN)) return null; [r,g,b]=hslToRgb(parts[0],parts[1],parts[2]);
      } else if (activeField === "css") {
        const found = CSS_COLORS[cssInput.toLowerCase().trim()]; if (!found) return null; [r,g,b]=found;
      }
      r=Math.max(0,Math.min(255,r)); g=Math.max(0,Math.min(255,g)); b=Math.max(0,Math.min(255,b));
      const [h,s,l] = rgbToHsl(r,g,b);
      return {
        hex: rgbToHex(r,g,b).toUpperCase(),
        rgb: `rgb(${r}, ${g}, ${b})`,
        rgba: `rgba(${r}, ${g}, ${b}, 1)`,
        hsl: `hsl(${h}, ${s}%, ${l}%)`,
        hsla: `hsla(${h}, ${s}%, ${l}%, 1)`,
        r, g, b, h, s, l,
        textColor: l > 55 ? "#000" : "#fff",
      };
    } catch { return null; }
  }, [hex, rgbInput, hslInput, cssInput, activeField]);

  return (
    <div className="space-y-5">
      {/* Color preview */}
      {colors && (
        <div className="rounded-[10px] overflow-hidden border border-border">
          <div className="h-24 w-full transition-colors" style={{ background: colors.hex }} />
          <div className="bg-surface px-4 py-2 flex items-center justify-between">
            <span className="font-mono text-sm text-text-primary">{colors.hex}</span>
            <span className="text-xs text-text-muted">rgb({colors.r},{colors.g},{colors.b}) · hsl({colors.h},{colors.s}%,{colors.l}%)</span>
          </div>
        </div>
      )}

      {/* Inputs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          { id:"hex", label:"HEX", value:colors?.hex ?? hex, onChange:(v:string)=>{setHex(v);setActive("hex");}, placeholder:"#F0A23A" },
          { id:"rgb", label:"RGB", value:activeField==="rgb"?rgbInput:(colors?`${colors.r}, ${colors.g}, ${colors.b}`:""), onChange:(v:string)=>{setRgb(v);setActive("rgb");}, placeholder:"240, 162, 58" },
          { id:"hsl", label:"HSL", value:activeField==="hsl"?hslInput:(colors?`${colors.h}, ${colors.s}%, ${colors.l}%`:""), onChange:(v:string)=>{setHsl(v);setActive("hsl");}, placeholder:"36, 85%, 58%" },
          { id:"css", label:"CSS name", value:cssInput, onChange:(v:string)=>{setCss(v);setActive("css");}, placeholder:"orange, blue, red…" },
        ].map(({ id, label, value, onChange, placeholder }) => (
          <div key={id}>
            <label className="input-label">{label}</label>
            <div className="flex gap-2">
              <input value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder}
                className="code-surface flex-1 rounded-[10px] px-3 py-2 font-mono text-sm text-text-primary outline-none" />
              <CopyButton value={value} iconOnly />
            </div>
          </div>
        ))}
      </div>

      {/* All formats */}
      {colors && (
        <div>
          <label className="input-label">{isRu ? "Все форматы" : "All formats"}</label>
          <div className="space-y-2">
            {[
              { label:"HEX",  value:colors.hex },
              { label:"RGB",  value:colors.rgb },
              { label:"RGBA", value:colors.rgba },
              { label:"HSL",  value:colors.hsl },
              { label:"HSLA", value:colors.hsla },
              { label:"CSS HEX (uppercase)", value:colors.hex },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between rounded-[8px] border border-border bg-surface px-3 py-2">
                <span className="text-xs text-text-muted w-32 shrink-0">{label}</span>
                <span className="font-mono text-sm text-text-primary flex-1">{value}</span>
                <CopyButton value={value} iconOnly />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
