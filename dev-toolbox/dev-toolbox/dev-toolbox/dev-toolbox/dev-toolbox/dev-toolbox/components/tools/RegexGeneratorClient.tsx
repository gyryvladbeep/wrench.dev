"use client";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Locale } from "@/lib/i18n/config";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

type Flavor = "JavaScript" | "Python" | "PCRE" | "Java" | "Go";
const FLAVORS: Flavor[] = ["JavaScript", "Python", "PCRE", "Java", "Go"];

const EXAMPLES = [
  { label: "Email (EN)", description: "Valid email address (user@domain.com)", flavor: "JavaScript" as Flavor, flags: "i", test: "user@example.com" },
  { label: "UUID (EN)", description: "UUID v4 format (8-4-4-4-12 hex characters)", flavor: "JavaScript" as Flavor, flags: "i", test: "550e8400-e29b-41d4-a716-446655440000" },
  { label: "Телефон РФ (RU)", description: "Российский номер телефона: +7 или 8, затем 10 цифр, разделители любые", flavor: "JavaScript" as Flavor, flags: "g", test: "+7 (999) 123-45-67" },
  { label: "IPv4 (EN)", description: "Valid IPv4 address (0-255 in each octet)", flavor: "JavaScript" as Flavor, flags: "", test: "192.168.1.1" },
];

export function RegexGeneratorClient({ locale }: { locale: Locale }) {
  const isRu = locale === "ru";
  const { success } = useToast();

  const [description, setDescription] = useState("");
  const [flavor,  setFlavor]  = useState<Flavor>("JavaScript");
  const [flags,   setFlags]   = useState("g");
  const [testStr, setTestStr] = useState("");
  const [result,  setResult]  = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [liveTest, setLiveTest] = useState<{ matches: string[]; valid: boolean } | null>(null);
  const abortRef  = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Extract regex from result for live testing
  function extractRegex(text: string): string {
    const match = text.match(/REGEX:\s*`([^`]+)`/);
    return match?.[1] ?? "";
  }

  function testRegex(regexStr: string, str: string) {
    if (!regexStr || !str) { setLiveTest(null); return; }
    try {
      const re = new RegExp(regexStr, flags.includes("g") ? flags : flags + "g");
      const matches = Array.from(str.matchAll(re)).map((m) => m[0]);
      setLiveTest({ matches, valid: true });
    } catch {
      setLiveTest({ matches: [], valid: false });
    }
  }

  function loadExample(ex: typeof EXAMPLES[0]) {
    setDescription(ex.description); setFlavor(ex.flavor); setFlags(ex.flags); setTestStr(ex.test);
    setResult(""); setError(""); setLiveTest(null);
  }

  async function generate() {
    if (!description.trim()) return;
    setError(""); setResult(""); setLoading(true); setLiveTest(null);
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    try {
      const res = await fetch("/api/regex-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, flavor, flags, testString: testStr, language: isRu ? "ru" : "en" }),
        signal: abortRef.current.signal,
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? `HTTP ${res.status}`); }
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");
      const dec = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value, { stream: true }).split("\n")) {
          if (line.startsWith('0:"')) {
            try { acc += JSON.parse(line.slice(2)); setResult(acc); } catch {}
          }
        }
      }
      // Auto-test after generation
      const rx = extractRegex(acc);
      if (rx && testStr) testRegex(rx, testStr);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (e: unknown) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message ?? "Error");
    } finally { setLoading(false); }
  }

  const extractedRegex = extractRegex(result);

  return (
    <div className="space-y-5">
      {/* Examples */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-text-muted">{isRu ? "Примеры:" : "Examples:"}</span>
        {EXAMPLES.map((ex) => (
          <button key={ex.label} onClick={() => loadExample(ex)}
            className="rounded border border-border bg-surface px-2.5 py-1 text-xs text-text-muted hover:border-accent/30 hover:text-text-primary transition-colors">
            {ex.label}
          </button>
        ))}
      </div>

      {/* Description */}
      <div>
        <label className="input-label">{isRu ? "Опишите паттерн простыми словами *" : "Describe the pattern in plain words *"}</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={loading} rows={3} spellCheck={false}
          placeholder={isRu
            ? "Например: email адрес, или российский номер телефона с кодом страны +7…"
            : "e.g. valid email address, or US phone number with optional country code…"}
          className="code-surface w-full rounded-[10px] p-3 text-sm text-text-primary outline-none disabled:opacity-60 resize-none" />
      </div>

      {/* Flavor + Flags */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="input-label">{isRu ? "Диалект regex" : "Regex flavor"}</label>
          <select value={flavor} onChange={(e) => setFlavor(e.target.value as Flavor)} disabled={loading}
            className="code-surface w-full rounded-[10px] px-3 py-2.5 text-sm text-text-primary outline-none disabled:opacity-60">
            {FLAVORS.map((f) => <option key={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className="input-label">{isRu ? "Флаги (g, i, m, s…)" : "Flags (g, i, m, s…)"}</label>
          <input value={flags} onChange={(e) => setFlags(e.target.value.replace(/[^gimsuy]/g, ""))} disabled={loading}
            placeholder="gi"
            className="code-surface w-full rounded-[10px] px-3 py-2.5 font-mono text-sm text-text-primary outline-none disabled:opacity-60" />
        </div>
      </div>

      {/* Test string */}
      <div>
        <label className="input-label">{isRu ? "Строка для теста (необязательно)" : "Test string (optional)"}</label>
        <input value={testStr} onChange={(e) => { setTestStr(e.target.value); if (extractedRegex) testRegex(extractedRegex, e.target.value); }}
          disabled={loading} placeholder={isRu ? "Вставьте строку для проверки…" : "Paste a string to test against…"}
          className="code-surface w-full rounded-[10px] px-3 py-2.5 font-mono text-sm text-text-primary outline-none disabled:opacity-60" />
        {liveTest && testStr && (
          <div className={`mt-1.5 flex items-center gap-2 text-xs ${liveTest.matches.length > 0 ? "text-accent" : "text-red-400"}`}>
            {liveTest.matches.length > 0
              ? <><span>✓</span><span>{liveTest.matches.length} {isRu ? "совпадений:" : "match(es):"} {liveTest.matches.slice(0, 3).map((m) => `"${m}"`).join(", ")}</span></>
              : <><span>✕</span><span>{isRu ? "Нет совпадений" : "No matches"}</span></>
            }
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={generate} disabled={loading || !description.trim()}>
          {loading ? (isRu ? "Генерирую…" : "Generating…") : (isRu ? "Сгенерировать regex" : "Generate Regex")}
        </Button>
        <Button variant="ghost" onClick={() => { setDescription(""); setTestStr(""); setResult(""); setError(""); setLiveTest(null); }} disabled={loading}>
          {isRu ? "Очистить" : "Clear"}
        </Button>
        {loading && <span className="flex items-center gap-2 text-xs text-text-muted"><span className="h-3 w-3 rounded-full border-2 border-accent border-t-transparent animate-spin inline-block" />{isRu ? "AI пишет regex…" : "AI is writing the regex…"}</span>}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-[10px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0" aria-hidden><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/><path d="M8 5v3M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          {error}
        </div>
      )}

      {loading && !result && (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-8 w-80" />
          <Skeleton className="h-3 w-48" />
          <div className="space-y-2 mt-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-3 w-full" />)}</div>
        </div>
      )}

      {result && (
        <div ref={resultRef} className="mt-6">
          {/* Extracted regex highlight */}
          {extractedRegex && (
            <div className="mb-4 flex items-center gap-3 rounded-[10px] border border-accent/30 bg-accent/5 px-4 py-3">
              <span className="font-mono text-sm text-accent break-all">{extractedRegex}</span>
              <button onClick={() => { navigator.clipboard.writeText(extractedRegex); success(isRu ? "Regex скопирован" : "Regex copied"); }}
                className="shrink-0 rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-text-muted hover:bg-surface-hover transition-colors ml-auto">
                {isRu ? "Копировать" : "Copy"}
              </button>
            </div>
          )}

          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">{isRu ? "Объяснение" : "Explanation"}</h2>
            <button onClick={() => { navigator.clipboard.writeText(result); success(isRu ? "Скопировано" : "Copied"); }}
              className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-text-muted hover:bg-surface-hover transition-colors">
              {isRu ? "Копировать всё" : "Copy all"}
            </button>
          </div>
          <pre className="code-surface max-h-[32rem] overflow-auto rounded-[10px] p-4 font-mono text-sm text-text-primary whitespace-pre-wrap">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}
