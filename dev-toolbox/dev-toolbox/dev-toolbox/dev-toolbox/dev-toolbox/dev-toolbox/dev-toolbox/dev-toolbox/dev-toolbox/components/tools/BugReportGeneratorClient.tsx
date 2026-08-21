"use client";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Locale } from "@/lib/i18n/config";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

type Severity = "Critical" | "Major" | "Minor" | "Trivial";
type Format   = "Markdown" | "Jira" | "JSON";

const SEVERITIES: Severity[] = ["Critical", "Major", "Minor", "Trivial"];
const FORMATS: Format[]      = ["Markdown", "Jira", "JSON"];

const SEVERITY_COLORS: Record<Severity, string> = {
  Critical: "text-red-400 border-red-500/30 bg-red-500/10",
  Major:    "text-orange-400 border-orange-500/30 bg-orange-500/10",
  Minor:    "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
  Trivial:  "text-text-muted border-border bg-surface",
};

const EXAMPLES = [
  {
    label: "Login bug (EN)",
    title: "Login button unresponsive on mobile Safari",
    steps: "1. Open Safari on iOS 16\n2. Navigate to the login page\n3. Enter valid email and password\n4. Tap the Login button",
    expected: "User is redirected to the dashboard",
    actual: "Nothing happens. The button appears to register the tap (visual feedback) but no navigation occurs.",
    environment: "iOS 16.5, Safari 16.5, iPhone 13 Pro, Production",
    severity: "Critical" as Severity,
  },
  {
    label: "Баг корзины (RU)",
    title: "Товар остаётся в корзине после успешной оплаты",
    steps: "1. Добавить товар в корзину\n2. Перейти к оформлению заказа\n3. Оплатить картой\n4. Получить подтверждение заказа\n5. Вернуться в корзину",
    expected: "Корзина пуста после успешной оплаты",
    actual: "Товар остаётся в корзине. При повторной покупке создаётся дублирующий заказ.",
    environment: "Chrome 120, Windows 11, Production, учётная запись с историей заказов",
    severity: "Major" as Severity,
  },
];

export function BugReportGeneratorClient({ locale }: { locale: Locale }) {
  const isRu = locale === "ru";
  const { success } = useToast();

  const [title,    setTitle]    = useState("");
  const [steps,    setSteps]    = useState("");
  const [expected, setExpected] = useState("");
  const [actual,   setActual]   = useState("");
  const [env,      setEnv]      = useState("");
  const [severity, setSeverity] = useState<Severity>("Major");
  const [format,   setFormat]   = useState<Format>("Markdown");
  const [result,   setResult]   = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const abortRef  = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  function loadExample(ex: typeof EXAMPLES[0]) {
    setTitle(ex.title); setSteps(ex.steps); setExpected(ex.expected);
    setActual(ex.actual); setEnv(ex.environment); setSeverity(ex.severity);
    setResult(""); setError("");
  }

  async function generate() {
    if (!steps.trim()) return;
    setError(""); setResult(""); setLoading(true);
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    try {
      const res = await fetch("/api/bug-report-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, steps, expected, actual, environment: env, severity, format, language: isRu ? "ru" : "en" }),
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
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (e: unknown) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message ?? "Error");
    } finally { setLoading(false); }
  }

  function handleCopy() {
    navigator.clipboard.writeText(result).then(() => success(isRu ? "Скопировано" : "Copied"));
  }

  function handleDownload() {
    const ext  = format === "JSON" ? "json" : format === "Jira" ? "txt" : "md";
    const blob = new Blob([result], { type: "text/plain" });
    const a    = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `bug-report.${ext}`; a.click();
    success(isRu ? "Скачано" : "Downloaded");
  }

  return (
    <div className="space-y-5">
      {/* Examples */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-text-muted self-center">{isRu ? "Примеры:" : "Examples:"}</span>
        {EXAMPLES.map((ex) => (
          <button key={ex.label} onClick={() => loadExample(ex)}
            className="rounded border border-border bg-surface px-2.5 py-1 text-xs text-text-muted hover:border-accent/30 hover:text-text-primary transition-colors">
            {ex.label}
          </button>
        ))}
      </div>

      {/* Title + Severity row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="input-label">{isRu ? "Заголовок баг-репорта" : "Bug title"}</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} disabled={loading}
            placeholder={isRu ? "Кратко опишите проблему…" : "Briefly describe the issue…"}
            className="code-surface w-full rounded-[10px] px-3 py-2.5 text-sm text-text-primary outline-none disabled:opacity-60" />
        </div>
        <div>
          <label className="input-label">Severity</label>
          <select value={severity} onChange={(e) => setSeverity(e.target.value as Severity)} disabled={loading}
            className="code-surface w-full rounded-[10px] px-3 py-2.5 text-sm text-text-primary outline-none disabled:opacity-60">
            {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Steps */}
      <div>
        <label className="input-label">{isRu ? "Шаги воспроизведения *" : "Steps to reproduce *"}</label>
        <textarea value={steps} onChange={(e) => setSteps(e.target.value)} disabled={loading} rows={5} spellCheck={false}
          placeholder={isRu ? "1. Открыть страницу\n2. Нажать кнопку\n3. …" : "1. Open the page\n2. Click the button\n3. …"}
          className="code-surface w-full rounded-[10px] p-3 text-sm text-text-primary outline-none disabled:opacity-60 resize-y" />
      </div>

      {/* Expected / Actual */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="input-label">{isRu ? "Ожидаемый результат" : "Expected result"}</label>
          <textarea value={expected} onChange={(e) => setExpected(e.target.value)} disabled={loading} rows={3} spellCheck={false}
            className="code-surface w-full rounded-[10px] p-3 text-sm text-text-primary outline-none disabled:opacity-60" />
        </div>
        <div>
          <label className="input-label">{isRu ? "Фактический результат" : "Actual result"}</label>
          <textarea value={actual} onChange={(e) => setActual(e.target.value)} disabled={loading} rows={3} spellCheck={false}
            className="code-surface w-full rounded-[10px] p-3 text-sm text-text-primary outline-none disabled:opacity-60" />
        </div>
      </div>

      {/* Environment */}
      <div>
        <label className="input-label">{isRu ? "Окружение (браузер, ОС, версия)" : "Environment (browser, OS, version)"}</label>
        <input value={env} onChange={(e) => setEnv(e.target.value)} disabled={loading}
          placeholder={isRu ? "Chrome 120, Windows 11, Production" : "Chrome 120, Windows 11, Production"}
          className="code-surface w-full rounded-[10px] px-3 py-2.5 text-sm text-text-primary outline-none disabled:opacity-60" />
      </div>

      {/* Format + Actions */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="input-label">{isRu ? "Формат" : "Format"}</label>
          <div className="flex rounded-[10px] border border-border overflow-hidden">
            {FORMATS.map((f) => (
              <button key={f} onClick={() => setFormat(f)} disabled={loading}
                className={`px-3 py-1.5 text-xs transition-colors ${format === f ? "bg-accent text-accent-fg" : "bg-surface text-text-muted hover:bg-surface-hover"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={generate} disabled={loading || !steps.trim()}>
          {loading ? (isRu ? "Генерирую…" : "Generating…") : (isRu ? "Сгенерировать баг-репорт" : "Generate Bug Report")}
        </Button>
        <Button variant="ghost" onClick={() => { setTitle(""); setSteps(""); setExpected(""); setActual(""); setEnv(""); setResult(""); setError(""); }} disabled={loading}>
          {isRu ? "Очистить" : "Clear"}
        </Button>
        {loading && <span className="flex items-center gap-2 text-xs text-text-muted"><span className="h-3 w-3 rounded-full border-2 border-accent border-t-transparent animate-spin inline-block" />{isRu ? "AI пишет баг-репорт…" : "AI is writing the report…"}</span>}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-[10px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0" aria-hidden><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/><path d="M8 5v3M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          {error}
        </div>
      )}

      {/* Skeleton */}
      {loading && !result && (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-5 w-64" />
          <Skeleton className="h-3 w-32" />
          <div className="space-y-2 mt-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className={`h-3 ${i % 2 === 0 ? "w-full" : "w-4/5"}`} />)}
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div ref={resultRef} className="mt-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-text-primary">{isRu ? "Баг-репорт" : "Bug Report"}</h2>
              <span className={`rounded border px-1.5 py-px text-[10px] font-medium ${SEVERITY_COLORS[severity]}`}>{severity}</span>
              <span className="rounded border border-border px-1.5 py-px text-[10px] text-text-muted">{format}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCopy} className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-text-muted hover:bg-surface-hover transition-colors">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden><rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M11 5V4a1 1 0 00-1-1H4a1 1 0 00-1 1v6a1 1 0 001 1h1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                {isRu ? "Копировать" : "Copy"}
              </button>
              <button onClick={handleDownload} className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-text-muted hover:bg-surface-hover transition-colors">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M8 2v8M5 7l3 3 3-3M3 13h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {isRu ? "Скачать" : "Download"}
              </button>
            </div>
          </div>
          <pre className="code-surface max-h-[40rem] overflow-auto rounded-[10px] p-4 font-mono text-sm text-text-primary whitespace-pre-wrap">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}
