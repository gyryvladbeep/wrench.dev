/** Корзины плотности экрана и пересчёт dp/pt <-> px. */
export interface DensityBucket {
  id: string;
  platform: "android" | "ios";
  label: string;
  scale: number;
  dpi?: number;
}

export const DENSITY_BUCKETS: DensityBucket[] = [
  { id: "ldpi", platform: "android", label: "ldpi", scale: 0.75, dpi: 120 },
  { id: "mdpi", platform: "android", label: "mdpi (baseline)", scale: 1, dpi: 160 },
  { id: "hdpi", platform: "android", label: "hdpi", scale: 1.5, dpi: 240 },
  { id: "xhdpi", platform: "android", label: "xhdpi", scale: 2, dpi: 320 },
  { id: "xxhdpi", platform: "android", label: "xxhdpi", scale: 3, dpi: 480 },
  { id: "xxxhdpi", platform: "android", label: "xxxhdpi", scale: 4, dpi: 640 },
  { id: "ios1x", platform: "ios", label: "@1x", scale: 1 },
  { id: "ios2x", platform: "ios", label: "@2x", scale: 2 },
  { id: "ios3x", platform: "ios", label: "@3x", scale: 3 },
];

export function dpToPx(dp: number, scale: number): number {
  return dp * scale;
}

export function pxToDp(px: number, scale: number): number {
  return scale === 0 ? NaN : px / scale;
}

/** Число с максимум двумя знаками после запятой, без хвостовых нулей. */
export function fmtNum(n: number): string {
  if (!Number.isFinite(n)) return "-";
  return (Math.round(n * 100) / 100).toString();
}
