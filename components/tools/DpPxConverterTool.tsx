"use client";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { DENSITY_BUCKETS, dpToPx, fmtNum, pxToDp } from "@/lib/mobile/density";

const inputClass = "code-surface w-full rounded-lg px-3 py-2.5 font-mono text-sm text-text-primary outline-none";

export function DpPxConverterTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [dpText, setDpText] = useState("48");
  const [pxText, setPxText] = useState("144");
  const [bucketId, setBucketId] = useState("xxhdpi");

  const dp = Number(dpText);
  const px = Number(pxText);
  const bucket = DENSITY_BUCKETS.find((b) => b.id === bucketId) ?? DENSITY_BUCKETS[0];
  const reverse = useMemo(() => pxToDp(px, bucket.scale), [px, bucket]);

  const android = DENSITY_BUCKETS.filter((b) => b.platform === "android");
  const ios = DENSITY_BUCKETS.filter((b) => b.platform === "ios");

  const row = (b: (typeof DENSITY_BUCKETS)[number]) => (
    <tr key={b.id} className="border-t border-border">
      <td className="px-3 py-2 text-text-primary">{b.label}</td>
      <td className="px-3 py-2 text-text-muted">{b.dpi ? `${b.dpi} dpi` : "-"}</td>
      <td className="px-3 py-2 text-text-muted">x{b.scale}</td>
      <td className="px-3 py-2 font-mono text-text-primary" data-testid={`px-${b.id}`}>{fmtNum(dpToPx(dp, b.scale))} px</td>
    </tr>
  );

  const head = (
    <thead>
      <tr className="text-left text-[11px] uppercase tracking-wider text-text-muted">
        <th className="px-3 py-2 font-medium">{isRu ? "Корзина" : "Bucket"}</th>
        <th className="px-3 py-2 font-medium">DPI</th>
        <th className="px-3 py-2 font-medium">{isRu ? "Масштаб" : "Scale"}</th>
        <th className="px-3 py-2 font-medium">{isRu ? "Пиксели" : "Pixels"}</th>
      </tr>
    </thead>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
        <div className="max-w-xs">
          <label htmlFor="dp-input" className="input-label">{isRu ? "Размер в dp (Android) или pt (iOS)" : "Size in dp (Android) or pt (iOS)"}</label>
          <input id="dp-input" type="number" min="0" step="any" value={dpText} onChange={(e) => setDpText(e.target.value)} className={inputClass} />
        </div>
        <div className="overflow-x-auto">
          <p className="mb-1 text-xs font-medium text-text-muted">Android</p>
          <table className="w-full text-sm">{head}<tbody>{android.map(row)}</tbody></table>
          <p className="mb-1 mt-4 text-xs font-medium text-text-muted">iOS</p>
          <table className="w-full text-sm">{head}<tbody>{ios.map(row)}</tbody></table>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
        <p className="text-sm font-medium text-text-primary">{isRu ? "Из пикселей в dp или pt" : "From pixels to dp or pt"}</p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-40">
            <label htmlFor="px-input" className="input-label">{isRu ? "Пиксели" : "Pixels"}</label>
            <input id="px-input" type="number" min="0" step="any" value={pxText} onChange={(e) => setPxText(e.target.value)} className={inputClass} />
          </div>
          <div className="w-52">
            <label htmlFor="bucket-select" className="input-label">{isRu ? "Плотность" : "Density"}</label>
            <select id="bucket-select" value={bucketId} onChange={(e) => setBucketId(e.target.value)} className={inputClass}>
              {DENSITY_BUCKETS.map((b) => (
                <option key={b.id} value={b.id}>{b.platform === "android" ? "Android" : "iOS"} {b.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-canvas px-3 py-2.5">
            <span className="font-mono text-sm text-text-primary" data-testid="dp-result">
              {fmtNum(reverse)} {bucket.platform === "android" ? "dp" : "pt"}
            </span>
            <CopyButton value={`${fmtNum(reverse)}${bucket.platform === "android" ? "dp" : "pt"}`} iconOnly />
          </div>
        </div>
        <p className="font-mono text-xs text-text-muted">
          {bucket.platform === "android" ? "px = dp * (dpi / 160); dp = px / scale" : "px = pt * scale; pt = px / scale"}
        </p>
      </div>
    </div>
  );
}
