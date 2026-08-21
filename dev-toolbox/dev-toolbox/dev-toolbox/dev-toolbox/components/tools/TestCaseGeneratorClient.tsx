"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Locale } from "@/lib/i18n/config";
import { TestCaseForm, FormValues, OutputFormat } from "./test-case-generator/TestCaseForm";
import { TestCaseResult } from "./test-case-generator/TestCaseResult";
import { TestCaseSkeleton } from "./test-case-generator/TestCaseSkeleton";

const STORAGE_KEY = "wb_tc_history";
const MAX_HISTORY = 5;

const DEFAULT: FormValues = {
  description:         "",
  testType:            "Functional",
  outputFormat:        "Markdown",
  count:               12,
  includeEdgeCases:    true,
  includePriority:     true,
  includePreconditions:true,
};

export function TestCaseGeneratorClient({ locale }: { locale: Locale }) {
  const isRu = locale === "ru";
  const [values, setValues] = useState<FormValues>(DEFAULT);
  const [result, setResult] = useState("");
  const [format, setFormat] = useState<OutputFormat>("Markdown");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<{ ts: number; description: string; result: string }[]>([]);
  const resultRef  = useRef<HTMLDivElement>(null);
  const abortRef   = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  const generate = useCallback(async () => {
    if (!values.description.trim()) return;
    setError(""); setResult(""); setLoading(true);
    setFormat(values.outputFormat);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/test-case-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, language: isRu ? "ru" : "en" }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // AI SDK data stream format: lines starting with '0:"...'
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (line.startsWith('0:"')) {
            try {
              const text = JSON.parse(line.slice(2));
              accumulated += text;
              setResult(accumulated);
            } catch {}
          }
        }
      }

      // Save to history
      if (accumulated) {
        const entry = { ts: Date.now(), description: values.description.slice(0, 120), result: accumulated };
        setHistory((prev) => {
          const next = [entry, ...prev].slice(0, MAX_HISTORY);
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
          return next;
        });
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      }
    } catch (e: unknown) {
      if ((e as Error).name === "AbortError") return;
      setError((e as Error).message ?? (isRu ? "Ошибка генерации" : "Generation failed"));
    } finally {
      setLoading(false);
    }
  }, [values, isRu]);

  function handleClear() {
    abortRef.current?.abort();
    setValues(DEFAULT); setResult(""); setError(""); setLoading(false);
  }

  return (
    <div>
      {/* History */}
      {history.length > 0 && (
        <div className="mb-5">
          <button onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M8 5v3l2 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            {isRu ? `История (${history.length})` : `History (${history.length})`}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`transition-transform ${showHistory ? "rotate-180" : ""}`} aria-hidden>
              <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </button>
          {showHistory && (
            <div className="mt-2 space-y-1">
              {history.map((h, i) => (
                <button key={i} onClick={() => { setResult(h.result); setShowHistory(false); }}
                  className="flex w-full items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-left text-xs text-text-muted hover:bg-surface-hover transition-colors">
                  <span className="shrink-0 opacity-50">{new Date(h.ts).toLocaleTimeString()}</span>
                  <span className="truncate">{h.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <TestCaseForm
        values={values}
        onChange={(p) => setValues((v) => ({ ...v, ...p }))}
        onSubmit={generate}
        onClear={handleClear}
        loading={loading}
        isRu={isRu}
      />

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-[10px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0" aria-hidden>
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M8 5v3M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {error}
        </div>
      )}

      {loading && !result && <TestCaseSkeleton />}

      {result && (
        <div ref={resultRef}>
          <TestCaseResult content={result} format={format} isRu={isRu} onEdit={setResult} />
        </div>
      )}
    </div>
  );
}
