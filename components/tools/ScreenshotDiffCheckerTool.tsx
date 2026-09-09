"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { DownloadIcon } from "@/components/icons/GameIcons";

interface DiffResult {
  diffPixels: number;
  totalPixels: number;
  percent: number;
  dataUrl: string;
  dimsMismatch: boolean;
  width: number;
  height: number;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image-load-failed"));
    img.src = URL.createObjectURL(file);
  });
}

function diffImages(a: ImageData, b: ImageData, threshold: number): { diffCount: number; out: ImageData } {
  const { width, height } = a;
  const out = new ImageData(width, height);
  let diffCount = 0;
  const maxDist = Math.sqrt(255 * 255 * 4);
  for (let i = 0; i < a.data.length; i += 4) {
    const dr = a.data[i] - b.data[i];
    const dg = a.data[i + 1] - b.data[i + 1];
    const db = a.data[i + 2] - b.data[i + 2];
    const da = a.data[i + 3] - b.data[i + 3];
    const dist = Math.sqrt(dr * dr + dg * dg + db * db + da * da) / maxDist;
    if (dist > threshold) {
      diffCount++;
      out.data[i] = 239; out.data[i + 1] = 68; out.data[i + 2] = 68; out.data[i + 3] = 255;
    } else {
      out.data[i] = a.data[i]; out.data[i + 1] = a.data[i + 1]; out.data[i + 2] = a.data[i + 2]; out.data[i + 3] = 60;
    }
  }
  return { diffCount, out };
}

export function ScreenshotDiffCheckerTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.common.copy === "Копировать";
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [previewA, setPreviewA] = useState("");
  const [previewB, setPreviewB] = useState("");
  const [threshold, setThreshold] = useState(10);
  const [result, setResult] = useState<DiffResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handlePick(which: "a" | "b", file: File | null) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (which === "a") { setFileA(file); setPreviewA(url); } else { setFileB(file); setPreviewB(url); }
    setResult(null);
    setError("");
  }

  async function compare() {
    if (!fileA || !fileB) return;
    setError("");
    setLoading(true);
    try {
      const [imgA, imgB] = await Promise.all([loadImage(fileA), loadImage(fileB)]);
      const width = Math.max(imgA.width, imgB.width);
      const height = Math.max(imgA.height, imgB.height);
      const dimsMismatch = imgA.width !== imgB.width || imgA.height !== imgB.height;

      const canvasA = document.createElement("canvas"); canvasA.width = width; canvasA.height = height;
      const ctxA = canvasA.getContext("2d"); if (!ctxA) throw new Error("canvas-unsupported");
      ctxA.drawImage(imgA, 0, 0);

      const canvasB = document.createElement("canvas"); canvasB.width = width; canvasB.height = height;
      const ctxB = canvasB.getContext("2d"); if (!ctxB) throw new Error("canvas-unsupported");
      ctxB.drawImage(imgB, 0, 0);

      const dataA = ctxA.getImageData(0, 0, width, height);
      const dataB = ctxB.getImageData(0, 0, width, height);
      const { diffCount, out } = diffImages(dataA, dataB, threshold / 100);

      const outCanvas = document.createElement("canvas"); outCanvas.width = width; outCanvas.height = height;
      const outCtx = outCanvas.getContext("2d"); if (!outCtx) throw new Error("canvas-unsupported");
      outCtx.putImageData(out, 0, 0);

      const totalPixels = width * height;
      setResult({
        diffPixels: diffCount,
        totalPixels,
        percent: (diffCount / totalPixels) * 100,
        dataUrl: outCanvas.toDataURL("image/png"),
        dimsMismatch,
        width,
        height,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  function downloadDiff() {
    if (!result) return;
    const link = document.createElement("a");
    link.download = "diff.png";
    link.href = result.dataUrl;
    link.click();
  }

  const isMatch = result !== null && result.percent < 0.1;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="input-label">{isRu ? "Изображение A (эталон)" : "Image A (baseline)"}</label>
          <label className="code-surface flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed border-border p-3 text-center">
            {previewA ? (
              <img src={previewA} alt="A" className="max-h-32 max-w-full object-contain" />
            ) : (
              <span className="text-sm text-text-muted">{isRu ? "Выберите файл" : "Choose a file"}</span>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePick("a", e.target.files?.[0] ?? null)} />
          </label>
        </div>
        <div>
          <label className="input-label">{isRu ? "Изображение B (новое)" : "Image B (candidate)"}</label>
          <label className="code-surface flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed border-border p-3 text-center">
            {previewB ? (
              <img src={previewB} alt="B" className="max-h-32 max-w-full object-contain" />
            ) : (
              <span className="text-sm text-text-muted">{isRu ? "Выберите файл" : "Choose a file"}</span>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePick("b", e.target.files?.[0] ?? null)} />
          </label>
        </div>
      </div>

      <div>
        <label className="input-label">{isRu ? `Порог чувствительности: ${threshold}%` : `Sensitivity threshold: ${threshold}%`}</label>
        <input type="range" min={1} max={50} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-full" />
        <p className="mt-1 text-xs text-text-muted">
          {isRu
            ? "Ниже — чувствительнее (ловит даже небольшие изменения цвета); выше — терпимее к сглаживанию и сжатию."
            : "Lower catches even small color shifts; higher tolerates anti-aliasing and compression noise."}
        </p>
      </div>

      <Button onClick={compare} disabled={!fileA || !fileB || loading}>
        {loading ? (isRu ? "Сравнение…" : "Comparing…") : (isRu ? "Сравнить" : "Compare")}
      </Button>

      {error && <p className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-400">{error}</p>}

      {result && (
        <div className="space-y-3">
          {result.dimsMismatch && (
            <p className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-warning">
              {isRu
                ? "Размеры изображений различаются — сравнение выполнено на холсте максимального размера, лишняя область тоже посчитана как отличие."
                : "Image dimensions differ — compared on a canvas sized to the larger image; the extra area also counts as a difference."}
            </p>
          )}
          <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${isMatch ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
            <span className={`text-2xl font-mono font-semibold ${isMatch ? "text-green-400" : "text-red-400"}`}>{result.percent.toFixed(2)}%</span>
            <span className="text-sm text-text-secondary">
              {isRu
                ? `отличается (${result.diffPixels.toLocaleString()} из ${result.totalPixels.toLocaleString()} пикселей)`
                : `different (${result.diffPixels.toLocaleString()} of ${result.totalPixels.toLocaleString()} pixels)`}
            </span>
            <span className="ml-auto shrink-0 text-xs text-text-muted">{result.width}×{result.height}</span>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="input-label mb-0">{isRu ? "Наложение отличий" : "Diff overlay"}</label>
              <Button variant="secondary" size="sm" onClick={downloadDiff}>
                <span className="flex items-center gap-1.5"><DownloadIcon size={12} /> {isRu ? "Скачать" : "Download"}</span>
              </Button>
            </div>
            <img src={result.dataUrl} alt="diff" className="w-full rounded-[10px] border border-border" style={{ imageRendering: "pixelated" }} />
          </div>
        </div>
      )}
    </div>
  );
}
