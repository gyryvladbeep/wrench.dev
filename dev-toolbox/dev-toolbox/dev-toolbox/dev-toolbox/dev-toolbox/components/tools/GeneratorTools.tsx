"use client";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

// ─── Lorem Ipsum ─────────────────────────────────────────────────────────────
const LOREM_WORDS = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure dolor reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim est laborum".split(" ");

function randomWord() { return LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]; }
function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

function generateLoremWords(count: number): string {
  return Array.from({ length: count }, randomWord).join(" ");
}
function generateLoremSentences(count: number): string {
  return Array.from({ length: count }, () => {
    const len = 8 + Math.floor(Math.random() * 10);
    return capitalize(Array.from({ length: len }, randomWord).join(" ")) + ".";
  }).join(" ");
}
function generateLoremParagraphs(count: number): string {
  return Array.from({ length: count }, () => {
    const sentences = 3 + Math.floor(Math.random() * 4);
    return generateLoremSentences(sentences);
  }).join("\n\n");
}

export function LoremIpsumTool({ dict }: { dict: Dictionary }) {
  const [mode, setMode] = useState<"words" | "sentences" | "paragraphs">("paragraphs");
  const [count, setCount] = useState(3);
  const [output, setOutput] = useState(() => generateLoremParagraphs(3));

  function generate() {
    if (mode === "words") setOutput(capitalize(generateLoremWords(count)) + ".");
    else if (mode === "sentences") setOutput(generateLoremSentences(count));
    else setOutput(generateLoremParagraphs(count));
  }

  const modes = [
    { id: "words", label: "Words" },
    { id: "sentences", label: "Sentences" },
    { id: "paragraphs", label: "Paragraphs" },
  ] as const;

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">Type</label>
          <div className="flex gap-1">
            {modes.map((m) => (
              <button key={m.id} onClick={() => setMode(m.id)}
                className={`rounded-[10px] px-3 py-1.5 text-sm ${mode === m.id ? "bg-accent text-accent-fg" : "bg-surface text-text-muted hover:bg-surface-hover"}`}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">Count</label>
          <input type="number" min={1} max={100} value={count} onChange={(e) => setCount(Number(e.target.value))}
            className="code-surface w-20 rounded-[10px] p-2 text-sm text-text-primary outline-none" />
        </div>
        <Button onClick={generate}>Generate</Button>
        <div className="ml-auto">
          <CopyButton value={output} label={dict.common.copy} copiedLabel={dict.common.copied} />
        </div>
      </div>
      <textarea readOnly value={output} rows={12}
        className="code-surface w-full rounded-[10px] p-3 text-sm text-text-primary outline-none" />
    </div>
  );
}

// ─── Random Color Generator ───────────────────────────────────────────────────
function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}
function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}
function randomHex(): string {
  return "#" + Array.from(crypto.getRandomValues(new Uint8Array(3))).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function RandomColorTool({ dict }: { dict: Dictionary }) {
  const [colors, setColors] = useState<string[]>(() => Array.from({ length: 5 }, randomHex));
  const [locked, setLocked] = useState<boolean[]>(new Array(5).fill(false));

  function generate() {
    setColors((prev) => prev.map((c, i) => locked[i] ? c : randomHex()));
  }

  function copyAll() {
    navigator.clipboard.writeText(colors.join("\n"));
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Button onClick={generate}>Generate</Button>
        <Button variant="secondary" onClick={copyAll}>Copy all HEX</Button>
      </div>
      <div className="space-y-2">
        {colors.map((hex, i) => {
          const { r, g, b } = hexToRgb(hex);
          const { h, s, l } = rgbToHsl(r, g, b);
          const textColor = l > 50 ? "#000" : "#fff";
          return (
            <div key={i} className="flex items-center gap-3 rounded-[10px] overflow-hidden border border-border">
              <div className="h-16 w-24 shrink-0 flex items-center justify-center font-mono text-sm font-bold" style={{ background: hex, color: textColor }}>
                {hex.toUpperCase()}
              </div>
              <div className="flex-1 grid grid-cols-3 gap-2 text-xs text-text-muted font-mono">
                <span>HEX: {hex.toUpperCase()}</span>
                <span>RGB: {r},{g},{b}</span>
                <span>HSL: {h}°,{s}%,{l}%</span>
              </div>
              <div className="flex items-center gap-2 pr-3">
                <button onClick={() => setLocked((p) => p.map((v, j) => j === i ? !v : v))}
                  title={locked[i] ? "Unlock" : "Lock"}
                  className={`text-sm ${locked[i] ? "text-accent" : "text-text-muted hover:text-text-primary"}`}>
                  {locked[i] ? "🔒" : "🔓"}
                </button>
                <CopyButton value={hex.toUpperCase()} label={dict.common.copy} copiedLabel={dict.common.copied} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── NanoID Generator ─────────────────────────────────────────────────────────
const DEFAULT_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-";

function generateNanoId(size: number, alphabet: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(size * 2));
  let id = "";
  for (const byte of bytes) {
    const idx = byte & (alphabet.length - 1);
    if (idx < alphabet.length) { id += alphabet[idx]; if (id.length === size) break; }
  }
  return id;
}

export function NanoIdTool({ dict }: { dict: Dictionary }) {
  const [size, setSize] = useState(21);
  const [alphabet, setAlphabet] = useState(DEFAULT_ALPHABET);
  const [count, setCount] = useState(5);
  const [ids, setIds] = useState<string[]>(() => Array.from({ length: 5 }, () => generateNanoId(21, DEFAULT_ALPHABET)));

  function generate() {
    if (!alphabet.trim()) return;
    setIds(Array.from({ length: Math.min(count, 200) }, () => generateNanoId(size, alphabet)));
  }

  const output = ids.join("\n");

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">Size</label>
          <input type="number" min={4} max={128} value={size} onChange={(e) => setSize(Number(e.target.value))}
            className="code-surface w-20 rounded-[10px] p-2 text-sm text-text-primary outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">Count</label>
          <input type="number" min={1} max={200} value={count} onChange={(e) => setCount(Number(e.target.value))}
            className="code-surface w-20 rounded-[10px] p-2 text-sm text-text-primary outline-none" />
        </div>
        <Button onClick={generate}>Generate</Button>
        <div className="ml-auto">
          <CopyButton value={output} label="Copy all" copiedLabel={dict.common.copied} />
        </div>
      </div>
      <div className="mb-3">
        <label className="mb-1 block text-xs font-medium text-text-muted">Alphabet</label>
        <input value={alphabet} onChange={(e) => setAlphabet(e.target.value)}
          className="code-surface w-full rounded-[10px] p-2 font-mono text-sm text-text-primary outline-none" />
      </div>
      <textarea readOnly value={output} rows={8}
        className="code-surface w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none" />
    </div>
  );
}
