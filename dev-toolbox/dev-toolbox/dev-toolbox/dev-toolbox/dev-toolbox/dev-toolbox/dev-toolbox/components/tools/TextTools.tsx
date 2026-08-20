"use client";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

// ─── Word Counter ─────────────────────────────────────────────────────────────
export function WordCounterTool({ dict }: { dict: Dictionary }) {
  const [text, setText] = useState("The quick brown fox jumps over the lazy dog.\nThis is a second sentence. And a third!");

  const stats = useMemo(() => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, "").length;
    const sentences = text.trim() ? (text.match(/[.!?]+/g) ?? []).length : 0;
    const paragraphs = text.trim() ? text.split(/\n\s*\n/).filter(Boolean).length : 0;
    const lines = text.split("\n").length;
    const readingTime = Math.max(1, Math.ceil(words / 200));
    return { words, chars, charsNoSpaces, sentences, paragraphs, lines, readingTime };
  }, [text]);

  const stats_items = [
    { label: "Words", value: stats.words },
    { label: "Characters", value: stats.chars },
    { label: "No spaces", value: stats.charsNoSpaces },
    { label: "Sentences", value: stats.sentences },
    { label: "Paragraphs", value: stats.paragraphs },
    { label: "Lines", value: stats.lines },
    { label: "Read time", value: `~${stats.readingTime} min` },
  ];

  return (
    <div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={10} spellCheck={false}
        placeholder="Paste or type your text here…"
        className="code-surface w-full rounded-[10px] p-3 text-sm text-text-primary outline-none" />
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {stats_items.map((s) => (
          <div key={s.label} className="code-surface rounded-[10px] p-3 text-center">
            <p className="text-xl font-semibold text-text-primary">{s.value}</p>
            <p className="text-xs text-text-muted">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Case Converter ───────────────────────────────────────────────────────────
const CASES = [
  { id: "lower",   label: "lowercase" },
  { id: "upper",   label: "UPPERCASE" },
  { id: "title",   label: "Title Case" },
  { id: "sentence",label: "Sentence case" },
  { id: "camel",   label: "camelCase" },
  { id: "pascal",  label: "PascalCase" },
  { id: "snake",   label: "snake_case" },
  { id: "kebab",   label: "kebab-case" },
  { id: "constant",label: "CONSTANT_CASE" },
] as const;
type CaseId = typeof CASES[number]["id"];

function toWords(str: string): string[] {
  return str
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function convertCase(str: string, to: CaseId): string {
  if (to === "lower") return str.toLowerCase();
  if (to === "upper") return str.toUpperCase();
  if (to === "sentence") return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  if (to === "title") return str.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
  const words = toWords(str);
  if (to === "camel")    return words.map((w, i) => i === 0 ? w : w[0].toUpperCase() + w.slice(1)).join("");
  if (to === "pascal")   return words.map((w) => w[0].toUpperCase() + w.slice(1)).join("");
  if (to === "snake")    return words.join("_");
  if (to === "kebab")    return words.join("-");
  if (to === "constant") return words.join("_").toUpperCase();
  return str;
}

export function CaseConverterTool({ dict }: { dict: Dictionary }) {
  const [input, setInput] = useState("the quick brown fox jumps over the lazy dog");
  const [active, setActive] = useState<CaseId>("camel");
  const output = useMemo(() => convertCase(input, active), [input, active]);

  return (
    <div>
      <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={4} spellCheck={false}
        placeholder="Type or paste text to convert…"
        className="code-surface w-full rounded-[10px] p-3 text-sm text-text-primary outline-none" />
      <div className="mt-3 flex flex-wrap gap-2">
        {CASES.map((c) => (
          <button key={c.id} onClick={() => setActive(c.id)}
            className={`rounded-full px-3 py-1 text-sm font-mono transition-colors ${active === c.id ? "bg-accent text-accent-fg" : "bg-surface text-text-muted hover:bg-surface-hover"}`}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="mt-3 code-surface rounded-[10px] p-4 flex items-start justify-between gap-3">
        <p className="font-mono text-sm text-text-primary break-all">{output}</p>
        <CopyButton value={output} label={dict.common.copy} copiedLabel={dict.common.copied} />
      </div>
    </div>
  );
}

// ─── Slug Generator ───────────────────────────────────────────────────────────
function toSlug(str: string, sep = "-"): string {
  return str
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, sep)
    .replace(/-+/g, sep);
}

export function SlugGeneratorTool({ dict }: { dict: Dictionary }) {
  const [input, setInput] = useState("Hello World! This is My Blog Post Title");
  const [sep, setSep] = useState<"-" | "_">("-");
  const output = useMemo(() => toSlug(input, sep), [input, sep]);

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <Button variant={sep === "-" ? "primary" : "secondary"} onClick={() => setSep("-")}>hyphen-case</Button>
        <Button variant={sep === "_" ? "primary" : "secondary"} onClick={() => setSep("_")}>underscore_case</Button>
      </div>
      <input value={input} onChange={(e) => setInput(e.target.value)}
        placeholder="Enter your title or phrase…"
        className="code-surface w-full rounded-[10px] p-3 text-sm text-text-primary outline-none mb-3" />
      <div className="code-surface rounded-[10px] p-4 flex items-center justify-between gap-3">
        <p className="font-mono text-sm text-accent break-all">{output}</p>
        <CopyButton value={output} label={dict.common.copy} copiedLabel={dict.common.copied} />
      </div>
    </div>
  );
}

// ─── Sort Lines ───────────────────────────────────────────────────────────────
export function SortLinesTool({ dict }: { dict: Dictionary }) {
  const [input, setInput] = useState("banana\nApple\ncherry\napricot\nBerry");
  const [mode, setMode] = useState<"az" | "za" | "length">("az");
  const [caseSensitive, setCaseSensitive] = useState(false);

  const output = useMemo(() => {
    const lines = input.split("\n");
    const sorted = [...lines].sort((a, b) => {
      if (mode === "length") return a.length - b.length;
      const ca = caseSensitive ? a : a.toLowerCase();
      const cb = caseSensitive ? b : b.toLowerCase();
      return mode === "az" ? ca.localeCompare(cb) : cb.localeCompare(ca);
    });
    return sorted.join("\n");
  }, [input, mode, caseSensitive]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {[{id:"az",label:"A → Z"},{id:"za",label:"Z → A"},{id:"length",label:"By length"}].map((m) => (
          <Button key={m.id} variant={mode === m.id ? "primary" : "secondary"} onClick={() => setMode(m.id as typeof mode)}>{m.label}</Button>
        ))}
        <label className="flex items-center gap-2 text-sm text-text-muted ml-2">
          <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} />
          Case sensitive
        </label>
        <div className="ml-auto">
          <CopyButton value={output} label={dict.common.copy} copiedLabel={dict.common.copied} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">{dict.common.input}</label>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={10} spellCheck={false}
            className="code-surface w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">Sorted</label>
          <textarea readOnly value={output} rows={10}
            className="code-surface w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none" />
        </div>
      </div>
    </div>
  );
}

// ─── Remove Duplicates ────────────────────────────────────────────────────────
export function RemoveDuplicatesTool({ dict }: { dict: Dictionary }) {
  const [input, setInput] = useState("apple\nbanana\napple\ncherry\nbanana\ndate");
  const [caseSensitive, setCaseSensitive] = useState(true);

  const { output, removed } = useMemo(() => {
    const lines = input.split("\n");
    const seen = new Set<string>();
    const unique = lines.filter((line) => {
      const key = caseSensitive ? line : line.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });
    return { output: unique.join("\n"), removed: lines.length - unique.length };
  }, [input, caseSensitive]);

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center gap-2 text-sm text-text-muted">
          <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} />
          Case sensitive
        </label>
        {removed > 0 && <span className="text-sm text-text-muted">{removed} duplicate{removed !== 1 ? "s" : ""} removed</span>}
        <div className="ml-auto">
          <CopyButton value={output} label={dict.common.copy} copiedLabel={dict.common.copied} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">{dict.common.input}</label>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={10} spellCheck={false}
            className="code-surface w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">Unique lines</label>
          <textarea readOnly value={output} rows={10}
            className="code-surface w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none" />
        </div>
      </div>
    </div>
  );
}

// ─── Remove Empty Lines ───────────────────────────────────────────────────────
export function RemoveEmptyLinesTool({ dict }: { dict: Dictionary }) {
  const [input, setInput] = useState("apple\n\nbanana\n\n\ncherry\n\ndate");
  const [trimWhitespace, setTrimWhitespace] = useState(true);

  const { output, removed } = useMemo(() => {
    const lines = input.split("\n");
    const filtered = lines.filter((line) => trimWhitespace ? line.trim() !== "" : line !== "");
    return { output: filtered.join("\n"), removed: lines.length - filtered.length };
  }, [input, trimWhitespace]);

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center gap-2 text-sm text-text-muted">
          <input type="checkbox" checked={trimWhitespace} onChange={(e) => setTrimWhitespace(e.target.checked)} />
          Treat whitespace-only lines as empty
        </label>
        {removed > 0 && <span className="text-sm text-text-muted">{removed} line{removed !== 1 ? "s" : ""} removed</span>}
        <div className="ml-auto">
          <CopyButton value={output} label={dict.common.copy} copiedLabel={dict.common.copied} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">{dict.common.input}</label>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={10} spellCheck={false}
            className="code-surface w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">Cleaned</label>
          <textarea readOnly value={output} rows={10}
            className="code-surface w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none" />
        </div>
      </div>
    </div>
  );
}
