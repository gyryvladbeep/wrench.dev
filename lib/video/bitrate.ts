export interface PlanInput {
  durationSec: number;
  targetBytes: number;
  audio: boolean;
  audioKbps: number;
  /** Размер контейнера и накладные расходы, доля от цели. */
  safety?: number;
}

export interface Plan {
  ok: boolean;
  totalKbps: number;
  videoKbps: number;
  audioKbps: number;
  /** Ожидаемый размер при указанных битрейтах, байт. */
  expectedBytes: number;
  warning: "none" | "too-low" | "very-low" | "no-duration";
}

export const FIVE_MB = 5 * 1024 * 1024;
export const DEFAULT_SAFETY = 0.9;

export function planCompression(input: PlanInput): Plan {
  const safety = input.safety ?? DEFAULT_SAFETY;
  if (!(input.durationSec > 0) || !Number.isFinite(input.durationSec) || !(input.targetBytes > 0)) {
    return { ok: false, totalKbps: 0, videoKbps: 0, audioKbps: 0, expectedBytes: 0, warning: "no-duration" };
  }
  const totalKbps = (input.targetBytes * 8 * safety) / input.durationSec / 1000;
  const audioKbps = input.audio ? Math.min(input.audioKbps, totalKbps * 0.4) : 0;
  const videoKbps = Math.max(0, totalKbps - audioKbps);
  const expectedBytes = Math.round(((videoKbps + audioKbps) * 1000 * input.durationSec) / 8);
  let warning: Plan["warning"] = "none";
  if (videoKbps < 100) warning = "very-low";
  else if (videoKbps < 250) warning = "too-low";
  return { ok: true, totalKbps, videoKbps, audioKbps, expectedBytes, warning };
}

export interface ResolutionSuggestion {
  width: number;
  height: number;
  fps: number;
}

/** Подбирает разрешение по бюджету бит на пиксель (около 0.07 бит/пиксель/кадр для VP8/VP9 в реальном времени). */
export function suggestResolution(srcW: number, srcH: number, videoKbps: number, srcFps = 30, bpp = 0.07): ResolutionSuggestion {
  const fps = videoKbps < 300 ? Math.min(15, srcFps) : Math.min(30, srcFps);
  const pixelsBudget = (videoKbps * 1000) / (bpp * fps);
  const srcPixels = srcW * srcH;
  const scale = Math.min(1, Math.sqrt(pixelsBudget / srcPixels));
  let w = Math.max(2, Math.floor((srcW * scale) / 2) * 2);
  let h = Math.max(2, Math.floor((srcH * scale) / 2) * 2);
  if (scale >= 0.98) { w = Math.floor(srcW / 2) * 2; h = Math.floor(srcH / 2) * 2; }
  return { width: w, height: h, fps };
}

export function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1048576).toFixed(2)} MB`;
}

export function fmtDuration(sec: number): string {
  const s = Math.round(sec);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}
