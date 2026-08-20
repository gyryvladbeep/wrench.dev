"use client";
import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";

interface Analysis {
  score: number; // 0-4
  label: string;
  color: string;
  entropy: number;
  checks: { label: string; pass: boolean }[];
  suggestions: string[];
  crackTime: string;
}

function analyzePassword(pwd: string, isRu: boolean): Analysis {
  const checks = [
    { label: isRu ? "Минимум 8 символов"        : "At least 8 characters",        pass: pwd.length >= 8 },
    { label: isRu ? "Минимум 12 символов"       : "At least 12 characters",       pass: pwd.length >= 12 },
    { label: isRu ? "Строчные буквы"            : "Lowercase letters",            pass: /[a-z]/.test(pwd) },
    { label: isRu ? "Заглавные буквы"           : "Uppercase letters",            pass: /[A-Z]/.test(pwd) },
    { label: isRu ? "Цифры"                     : "Numbers",                      pass: /[0-9]/.test(pwd) },
    { label: isRu ? "Спецсимволы (!@#$…)"       : "Special characters (!@#$…)",   pass: /[^a-zA-Z0-9]/.test(pwd) },
    { label: isRu ? "Нет повторяющихся паттернов": "No repeated patterns",        pass: !/(.)\1{2,}/.test(pwd) },
    { label: isRu ? "Нет очевидных слов"        : "No common words",              pass: !/password|qwerty|123456|admin|login/i.test(pwd) },
  ];

  // Entropy estimate
  let charsetSize = 0;
  if (/[a-z]/.test(pwd)) charsetSize += 26;
  if (/[A-Z]/.test(pwd)) charsetSize += 26;
  if (/[0-9]/.test(pwd)) charsetSize += 10;
  if (/[^a-zA-Z0-9]/.test(pwd)) charsetSize += 32;
  const entropy = charsetSize > 0 ? Math.log2(Math.pow(charsetSize, pwd.length)) : 0;

  const passed = checks.filter((c) => c.pass).length;
  const score  = Math.min(4, Math.floor(passed / 2));

  const labels   = isRu
    ? ["Очень слабый", "Слабый", "Средний", "Хороший", "Сильный"]
    : ["Very Weak", "Weak", "Fair", "Good", "Strong"];
  const colors   = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];

  // Crack time estimate
  const combinations = Math.pow(charsetSize || 1, pwd.length);
  const guessesPerSec = 1e10;
  const seconds = combinations / guessesPerSec;
  const crackTime = seconds < 1 ? (isRu ? "мгновенно" : "instantly")
    : seconds < 60 ? `${Math.round(seconds)}s`
    : seconds < 3600 ? `${Math.round(seconds/60)}m`
    : seconds < 86400 ? `${Math.round(seconds/3600)}h`
    : seconds < 31536000 ? `${Math.round(seconds/86400)}d`
    : seconds < 3153600000 ? `${Math.round(seconds/31536000)}y`
    : (isRu ? "века" : "centuries");

  const suggestions: string[] = [];
  if (!checks[0].pass) suggestions.push(isRu ? "Используйте минимум 8 символов" : "Use at least 8 characters");
  if (!checks[3].pass) suggestions.push(isRu ? "Добавьте заглавные буквы" : "Add uppercase letters");
  if (!checks[4].pass) suggestions.push(isRu ? "Добавьте цифры" : "Add numbers");
  if (!checks[5].pass) suggestions.push(isRu ? "Добавьте спецсимволы" : "Add special characters");
  if (!checks[1].pass && checks[0].pass) suggestions.push(isRu ? "Увеличьте длину до 12+ символов" : "Increase length to 12+ characters");

  return { score, label: labels[score], color: colors[score], entropy: Math.round(entropy), checks, suggestions, crackTime };
}

export function PasswordStrengthTool({ dict }: { dict: Dictionary }) {
  const [pwd, setPwd]     = useState("");
  const [show, setShow]   = useState(false);
  const isRu = dict.common.copy === "Копировать";
  const analysis = useMemo(() => pwd ? analyzePassword(pwd, isRu) : null, [pwd, isRu]);

  return (
    <div className="space-y-5 max-w-xl">
      <div>
        <label className="input-label">{isRu ? "Пароль для проверки" : "Password to check"}</label>
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder={isRu ? "Введите пароль…" : "Enter password…"}
            className="code-surface w-full rounded-lg px-3 py-2.5 pr-10 text-sm text-text-primary outline-none"
            autoComplete="new-password"
          />
          <button onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted hover:text-text-secondary transition-colors">
            {show ? (isRu ? "Скрыть" : "Hide") : (isRu ? "Показать" : "Show")}
          </button>
        </div>
      </div>

      {analysis && (
        <>
          {/* Strength bar */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: analysis.color }}>{analysis.label}</span>
              <span className="text-xs text-text-muted">{analysis.entropy} {isRu ? "бит энтропии" : "bits entropy"}</span>
            </div>
            <div className="flex gap-1">
              {[0,1,2,3].map((i) => (
                <div key={i} className="h-1.5 flex-1 rounded-full transition-colors duration-300"
                  style={{ background: i <= analysis.score - 1 ? analysis.color : "#27272a" }} />
              ))}
            </div>
          </div>

          {/* Crack time */}
          <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2.5">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-text-muted shrink-0" aria-hidden>
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M8 5v3l2 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <span className="text-xs text-text-muted">
              {isRu ? "Время взлома перебором:" : "Brute-force crack time:"}
            </span>
            <span className="text-xs font-mono font-semibold text-text-primary">{analysis.crackTime}</span>
          </div>

          {/* Checks */}
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {analysis.checks.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className={c.pass ? "text-success" : "text-text-disabled"}>
                  {c.pass ? "✓" : "○"}
                </span>
                <span className={c.pass ? "text-text-secondary" : "text-text-muted"}>{c.label}</span>
              </div>
            ))}
          </div>

          {/* Suggestions */}
          {analysis.suggestions.length > 0 && (
            <div className="rounded-md border border-border bg-surface p-3 space-y-1.5">
              <p className="text-xs font-medium text-text-secondary">{isRu ? "Рекомендации:" : "Suggestions:"}</p>
              {analysis.suggestions.map((s, i) => (
                <p key={i} className="text-xs text-text-muted">→ {s}</p>
              ))}
            </div>
          )}

          <p className="text-xs text-text-muted">
            {isRu
              ? "Пароль анализируется локально в браузере. Он никуда не передаётся."
              : "Password is analyzed locally in your browser. It is never transmitted."}
          </p>
        </>
      )}
    </div>
  );
}
