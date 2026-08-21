"use client";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

// ─── Hex ─────────────────────────────────────────────────────────────────────
function textToHex(str: string): string {
  return Array.from(new TextEncoder().encode(str))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");
}
function hexToText(hex: string): string {
  const bytes = hex.trim().replace(/\s+/g, " ").split(" ").map((h) => parseInt(h, 16));
  return new TextDecoder().decode(new Uint8Array(bytes));
}

export function HexEncodeDecodeTool({ dict }: { dict: Dictionary }) {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("Hello, Dev Toolbox!");

  const result = useMemo(() => {
    if (!input) return { ok: true as const, value: "" };
    try {
      return { ok: true as const, value: mode === "encode" ? textToHex(input) : hexToText(input) };
    } catch (e) {
      return { ok: false as const, message: "Invalid hex input" };
    }
  }, [input, mode]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Button variant={mode === "encode" ? "primary" : "secondary"} onClick={() => setMode("encode")}>Text → Hex</Button>
        <Button variant={mode === "decode" ? "primary" : "secondary"} onClick={() => setMode("decode")}>Hex → Text</Button>
        <div className="ml-auto">
          <CopyButton value={result.ok ? result.value : ""} label={dict.common.copy} copiedLabel={dict.common.copied} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">{dict.common.input}</label>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false}
            className="code-surface h-48 w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">{dict.common.output}</label>
          <textarea readOnly value={result.ok ? result.value : result.message} spellCheck={false}
            className={`code-surface h-48 w-full rounded-[10px] p-3 font-mono text-sm outline-none ${result.ok ? "text-text-primary" : "text-red-400"}`} />
        </div>
      </div>
    </div>
  );
}

// ─── Binary ──────────────────────────────────────────────────────────────────
function textToBinary(str: string): string {
  return Array.from(new TextEncoder().encode(str))
    .map((b) => b.toString(2).padStart(8, "0"))
    .join(" ");
}
function binaryToText(bin: string): string {
  const bytes = bin.trim().replace(/\s+/g, " ").split(" ").map((b) => parseInt(b, 2));
  return new TextDecoder().decode(new Uint8Array(bytes));
}

export function BinaryConverterTool({ dict }: { dict: Dictionary }) {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("Hello!");

  const result = useMemo(() => {
    if (!input) return { ok: true as const, value: "" };
    try {
      return { ok: true as const, value: mode === "encode" ? textToBinary(input) : binaryToText(input) };
    } catch {
      return { ok: false as const, message: "Invalid binary input — use 8-bit groups (e.g. 01001000)" };
    }
  }, [input, mode]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Button variant={mode === "encode" ? "primary" : "secondary"} onClick={() => setMode("encode")}>Text → Binary</Button>
        <Button variant={mode === "decode" ? "primary" : "secondary"} onClick={() => setMode("decode")}>Binary → Text</Button>
        <div className="ml-auto">
          <CopyButton value={result.ok ? result.value : ""} label={dict.common.copy} copiedLabel={dict.common.copied} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">{dict.common.input}</label>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false}
            className="code-surface h-48 w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">{dict.common.output}</label>
          <textarea readOnly value={result.ok ? result.value : result.message} spellCheck={false}
            className={`code-surface h-48 w-full rounded-[10px] p-3 font-mono text-sm outline-none break-all ${result.ok ? "text-text-primary" : "text-red-400"}`} />
        </div>
      </div>
    </div>
  );
}

// ─── ROT13 ───────────────────────────────────────────────────────────────────
function rot13(str: string): string {
  return str.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

export function Rot13Tool({ dict }: { dict: Dictionary }) {
  const [input, setInput] = useState("Hello, Dev Toolbox!");
  const output = useMemo(() => rot13(input), [input]);

  return (
    <div>
      <div className="flex justify-end mb-4">
        <CopyButton value={output} label={dict.common.copy} copiedLabel={dict.common.copied} />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">{dict.common.input}</label>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false}
            className="code-surface h-48 w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">ROT13 output</label>
          <textarea readOnly value={output} spellCheck={false}
            className="code-surface h-48 w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none" />
        </div>
      </div>
      <p className="mt-2 text-xs text-text-muted">ROT13 is its own inverse — applying it twice returns the original text.</p>
    </div>
  );
}
