"use client";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Dictionary } from "@/lib/i18n/dictionary-types";

export function QrCodeGeneratorTool({ dict }: { dict: Dictionary }) {
  const [input, setInput] = useState("https://devtoolbox.example.com");
  const [ecLevel, setEcLevel] = useState<"L" | "M" | "Q" | "H">("M");
  const [size, setSize] = useState(300);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!input.trim() || !canvasRef.current) return;
    setError("");
    QRCode.toCanvas(canvasRef.current, input, {
      width: size,
      margin: 2,
      errorCorrectionLevel: ecLevel,
      color: { dark: "#F2F2F5", light: "#0B0B0F" },
    }).catch((e) => setError(e.message));
  }, [input, ecLevel, size]);

  function download(format: "png" | "svg") {
    if (!input.trim()) return;
    if (format === "png") {
      const link = document.createElement("a");
      link.download = "qrcode.png";
      link.href = canvasRef.current?.toDataURL("image/png") ?? "";
      link.click();
    } else {
      QRCode.toString(input, { type: "svg", width: size, errorCorrectionLevel: ecLevel }, (err, svg) => {
        if (err) return;
        const blob = new Blob([svg], { type: "image/svg+xml" });
        const link = document.createElement("a");
        link.download = "qrcode.svg";
        link.href = URL.createObjectURL(blob);
        link.click();
      });
    }
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted">Content</label>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={4} spellCheck={false}
              placeholder="URL, text, email, phone…"
              className="code-surface w-full rounded-[10px] p-3 text-sm text-text-primary outline-none" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted">Error correction</label>
            <div className="flex gap-2">
              {(["L","M","Q","H"] as const).map((l) => (
                <button key={l} onClick={() => setEcLevel(l)}
                  className={`flex-1 rounded-[10px] py-1.5 text-sm ${ecLevel === l ? "bg-accent text-accent-fg" : "bg-surface text-text-muted hover:bg-surface-hover"}`}
                  title={{ L: "Low (7%)", M: "Medium (15%)", Q: "Quartile (25%)", H: "High (30%)" }[l]}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted">Size: {size}px</label>
            <input type="range" min={150} max={600} step={50} value={size} onChange={(e) => setSize(Number(e.target.value))}
              className="w-full" />
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => download("png")}>⬇ Download PNG</Button>
            <Button variant="secondary" onClick={() => download("svg")}>⬇ Download SVG</Button>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center">
          {error ? (
            <p className="text-sm text-red-400">{error}</p>
          ) : (
            <canvas ref={canvasRef} className="rounded-[10px] border border-border" />
          )}
        </div>
      </div>
    </div>
  );
}
