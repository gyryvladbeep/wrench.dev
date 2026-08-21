"use client";
import { useCallback, useRef, useState } from "react";
import { Locale } from "@/lib/i18n/config";
import { CopyButton } from "@/components/CopyButton";

type Lang = "javascript" | "json" | "regex" | "sql";

interface LangMeta {
  label: string;
  placeholder: string;
  placeholderRu: string;
  defaultCode: string;
}

const LANGS: Record<Lang, LangMeta> = {
  javascript: {
    label: "JavaScript",
    placeholder: "Write JavaScript and press Run…",
    placeholderRu: "Напиши JavaScript и нажми Run…",
    defaultCode: `// JavaScript Playground
// All console.log output appears below

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Generate first 10 Fibonacci numbers
const fibs = Array.from({ length: 10 }, (_, i) => fibonacci(i));
console.log("Fibonacci:", fibs);

// Object manipulation
const users = [
  { name: "Alice", role: "QA", score: 95 },
  { name: "Bob",   role: "Backend", score: 88 },
  { name: "Carol", role: "Frontend", score: 92 },
];

const topUsers = users
  .filter(u => u.score >= 90)
  .sort((a, b) => b.score - a.score)
  .map(u => \`\${u.name} (\${u.role}): \${u.score}\`);

console.log("Top users:", topUsers);`,
  },
  json: {
    label: "JSON",
    placeholder: "Paste JSON to format and validate…",
    placeholderRu: "Вставь JSON для форматирования и валидации…",
    defaultCode: `{
  "name": "Wrench-Branch",
  "version": "1.0.0",
  "description": "Developer & QA Toolbox",
  "features": {
    "tools": 60,
    "challenges": 56,
    "languages": ["en", "ru"]
  },
  "pricing": {
    "free": { "price": 0, "ai_per_day": 3 },
    "pro":  { "price": 5, "ai_per_day": -1 }
  }
}`,
  },
  regex: {
    label: "Regex",
    placeholder: "Enter a regex pattern…",
    placeholderRu: "Введи regex паттерн…",
    defaultCode: `^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$`,
  },
  sql: {
    label: "SQL",
    placeholder: "Write a SQL query…",
    placeholderRu: "Напиши SQL запрос…",
    defaultCode: `-- SQL Formatter & Validator
SELECT
  u.id,
  u.name,
  u.email,
  COUNT(o.id) AS order_count,
  SUM(o.total) AS total_spent
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE u.created_at >= '2024-01-01'
  AND u.is_active = true
GROUP BY u.id, u.name, u.email
HAVING COUNT(o.id) > 0
ORDER BY total_spent DESC
LIMIT 10;`,
  },
};

// Regex test strings
const REGEX_TEST_STRINGS = [
  "user@example.com",
  "alice.bob@company.org",
  "notanemail",
  "@nodomain.com",
  "test+tag@mail.co.uk",
  "user @example.com",
  "hello@world.io",
  "bad@",
];

interface Output {
  type: "log" | "error" | "warn" | "result";
  text: string;
}

function runJavaScript(code: string): Output[] {
  const outputs: Output[] = [];
  const origLog   = console.log;
  const origWarn  = console.warn;
  const origError = console.error;

  try {
    console.log   = (...args: unknown[]) => outputs.push({ type:"log",   text: args.map(a => typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)).join(" ") });
    console.warn  = (...args: unknown[]) => outputs.push({ type:"warn",  text: args.map(a => typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)).join(" ") });
    console.error = (...args: unknown[]) => outputs.push({ type:"error", text: args.map(a => typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)).join(" ") });

    // eslint-disable-next-line no-new-func
    const result = new Function(code)();
    if (result !== undefined) {
      outputs.push({ type:"result", text: typeof result === "object" ? JSON.stringify(result, null, 2) : String(result) });
    }
  } catch (e) {
    outputs.push({ type:"error", text: e instanceof Error ? `${e.name}: ${e.message}` : String(e) });
  } finally {
    console.log   = origLog;
    console.warn  = origWarn;
    console.error = origError;
  }
  return outputs;
}

function formatJSON(code: string): { ok: boolean; result: string } {
  try {
    const parsed = JSON.parse(code);
    return { ok: true, result: JSON.stringify(parsed, null, 2) };
  } catch (e) {
    return { ok: false, result: e instanceof Error ? e.message : "Invalid JSON" };
  }
}

function testRegex(pattern: string): { ok: boolean; matches: { str: string; match: boolean }[]; error?: string } {
  try {
    const re = new RegExp(pattern);
    return { ok: true, matches: REGEX_TEST_STRINGS.map(str => ({ str, match: re.test(str) })) };
  } catch (e) {
    return { ok: false, matches: [], error: e instanceof Error ? e.message : "Invalid regex" };
  }
}

function formatSQL(code: string): string {
  // Basic SQL formatter
  return code
    .replace(/\bSELECT\b/gi, "SELECT")
    .replace(/\bFROM\b/gi, "\nFROM")
    .replace(/\bWHERE\b/gi, "\nWHERE")
    .replace(/\bJOIN\b/gi, "\nJOIN")
    .replace(/\bLEFT JOIN\b/gi, "\nLEFT JOIN")
    .replace(/\bINNER JOIN\b/gi, "\nINNER JOIN")
    .replace(/\bGROUP BY\b/gi, "\nGROUP BY")
    .replace(/\bORDER BY\b/gi, "\nORDER BY")
    .replace(/\bHAVING\b/gi, "\nHAVING")
    .replace(/\bLIMIT\b/gi, "\nLIMIT")
    .replace(/\bAND\b/gi, "\n  AND")
    .replace(/\bOR\b/gi, "\n  OR")
    .trim();
}

export function PlaygroundClient({ locale }: { locale: Locale }) {
  const isRu = locale === "ru";
  const [lang,    setLang]    = useState<Lang>("javascript");
  const [code,    setCode]    = useState(LANGS.javascript.defaultCode);
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [result,  setResult]  = useState<string>("");
  const [running, setRunning] = useState(false);
  const [regexInput, setRegexInput] = useState(LANGS.regex.defaultCode);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleLangChange = useCallback((l: Lang) => {
    setLang(l);
    setCode(LANGS[l].defaultCode);
    setOutputs([]);
    setResult("");
    if (l === "regex") setRegexInput(LANGS.regex.defaultCode);
  }, []);

  function handleRun() {
    setRunning(true);
    setOutputs([]);
    setResult("");

    setTimeout(() => {
      try {
        if (lang === "javascript") {
          const out = runJavaScript(code);
          setOutputs(out);
        } else if (lang === "json") {
          const { ok, result: r } = formatJSON(code);
          if (ok) setResult(r);
          else setOutputs([{ type:"error", text: r }]);
        } else if (lang === "regex") {
          const { ok, matches, error } = testRegex(regexInput);
          if (!ok) setOutputs([{ type:"error", text: error ?? "Invalid regex" }]);
          else {
            const out = matches.map(m => ({
              type: (m.match ? "log" : "warn") as Output["type"],
              text: `${m.match ? "✓" : "✗"} ${m.str}`,
            }));
            setOutputs(out);
          }
        } else if (lang === "sql") {
          setResult(formatSQL(code));
        }
      } catch (e) {
        setOutputs([{ type:"error", text: String(e) }]);
      }
      setRunning(false);
    }, 50);
  }

  const outputText = outputs.map(o => o.text).join("\n");
  const finalResult = result || outputText;

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="rounded border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[11px] font-medium text-violet-400 uppercase tracking-wider">
            Playground
          </span>
        </div>
        <h1 className="text-2xl font-bold text-text-primary">
          {isRu ? "Браузерная песочница" : "Browser Playground"}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          {isRu
            ? "Пиши и запускай JavaScript, форматируй JSON, тестируй регулярные выражения прямо в браузере."
            : "Write and run JavaScript, format JSON, test regex — all in your browser without any setup."}
        </p>
      </div>

      {/* Lang tabs */}
      <div className="mb-4 flex gap-1 rounded-lg border border-border bg-surface p-1 w-fit">
        {(Object.keys(LANGS) as Lang[]).map((l) => (
          <button key={l} onClick={() => handleLangChange(l)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${lang === l ? "bg-canvas text-text-primary" : "text-text-muted hover:text-text-secondary"}`}>
            {LANGS[l].label}
          </button>
        ))}
      </div>

      {/* Editor + Output */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="input-label">{isRu ? "Код" : "Code"}</label>
            <div className="flex gap-2">
              <button onClick={() => { setCode(""); setOutputs([]); setResult(""); }}
                className="text-xs text-text-muted hover:text-text-secondary transition-colors">
                {isRu ? "Очистить" : "Clear"}
              </button>
              <button onClick={() => { setCode(LANGS[lang].defaultCode); setOutputs([]); setResult(""); }}
                className="text-xs text-text-muted hover:text-text-secondary transition-colors">
                {isRu ? "Пример" : "Example"}
              </button>
            </div>
          </div>

          {/* Regex special input */}
          {lang === "regex" && (
            <div className="mb-2">
              <label className="input-label">{isRu ? "Паттерн" : "Pattern"}</label>
              <div className="code-surface flex items-center gap-2 rounded-lg px-3 py-2">
                <span className="text-text-muted font-mono">/</span>
                <input value={regexInput} onChange={(e) => setRegexInput(e.target.value)}
                  className="flex-1 bg-transparent font-mono text-sm text-text-primary outline-none"
                  placeholder="pattern" spellCheck={false} />
                <span className="text-text-muted font-mono">/</span>
              </div>
              <p className="mt-2 text-xs text-text-muted">{isRu ? "Тестовые строки:" : "Test strings:"}</p>
            </div>
          )}

          <textarea ref={textareaRef} value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleRun(); } }}
            placeholder={isRu ? LANGS[lang].placeholderRu : LANGS[lang].placeholder}
            spellCheck={false} rows={lang === "regex" ? 8 : 20}
            className="code-surface w-full rounded-lg p-4 font-mono text-sm text-text-primary outline-none resize-none" />

          <button onClick={handleRun} disabled={running}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-semibold text-accent-fg hover:bg-amber-400 disabled:opacity-60 transition-colors">
            {running ? (
              <>{isRu ? "Запуск…" : "Running…"}</>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M5 3l8 5-8 5V3z" fill="currentColor"/>
                </svg>
                {isRu ? "Запустить" : "Run"}
                <kbd className="ml-1 rounded border border-amber-700/40 bg-amber-900/30 px-1.5 py-px font-mono text-[10px]">⌘↵</kbd>
              </>
            )}
          </button>
        </div>

        {/* Output */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="input-label">{isRu ? "Результат" : "Output"}</label>
            {finalResult && <CopyButton value={finalResult} />}
          </div>

          <div className="code-surface min-h-[400px] rounded-lg p-4 font-mono text-sm overflow-auto">
            {outputs.length === 0 && !result ? (
              <p className="text-text-muted text-xs">
                {isRu ? "Нажми Run чтобы увидеть результат…" : "Press Run to see output…"}
              </p>
            ) : lang === "javascript" ? (
              <div className="space-y-1">
                {outputs.map((o, i) => (
                  <div key={i} className={`leading-relaxed whitespace-pre-wrap ${
                    o.type === "error" ? "text-red-400" :
                    o.type === "warn"  ? "text-amber-400" :
                    o.type === "result" ? "text-violet-400" :
                    "text-text-primary"
                  }`}>
                    {o.type === "error"  && <span className="text-red-500 mr-2">✗</span>}
                    {o.type === "warn"   && <span className="text-amber-500 mr-2">⚠</span>}
                    {o.type === "result" && <span className="text-violet-500 mr-2">→</span>}
                    {o.text}
                  </div>
                ))}
              </div>
            ) : lang === "regex" ? (
              <div className="space-y-1">
                {outputs.map((o, i) => (
                  <div key={i} className={`leading-relaxed ${o.type === "log" ? "text-success" : o.type === "error" ? "text-red-400" : "text-text-muted"}`}>
                    {o.text}
                  </div>
                ))}
              </div>
            ) : (
              <pre className="text-text-primary whitespace-pre-wrap leading-relaxed">{result}</pre>
            )}
          </div>

          {/* Tips */}
          <div className="rounded-md border border-border bg-surface/50 p-3 text-xs text-text-muted">
            {lang === "javascript" && (
              <span>{isRu ? "console.log(), console.warn(), console.error() — всё выводится выше. Код выполняется в браузере." : "console.log(), warn(), error() output appears above. Code runs in your browser."}</span>
            )}
            {lang === "json" && (
              <span>{isRu ? "Вставь любой JSON — будет отформатирован и провалидирован." : "Paste any JSON — it will be formatted and validated."}</span>
            )}
            {lang === "regex" && (
              <span>{isRu ? "Введи regex паттерн — проверяется против набора тестовых строк." : "Enter a regex pattern — tested against a set of sample strings."}</span>
            )}
            {lang === "sql" && (
              <span>{isRu ? "SQL форматируется локально. Выполнение запросов не поддерживается." : "SQL is formatted locally. Query execution is not supported."}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
