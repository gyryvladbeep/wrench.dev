"use client";

import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";

interface MatchInfo { text: string; index: number; groups: (string | undefined)[]; }

export function RegexTesterTool({ dict }: { dict: Dictionary }) {
  const [pattern, setPattern] = useState("(\\w+)@(\\w+\\.\\w+)");
  const [flags, setFlags] = useState("gi");
  const [testString, setTestString] = useState(
    "Contact: ada@example.com or grace@example.org for support."
  );
  const t = dict.tools.regex;

  const flagOptions = [
    { flag: "g", label: t.flagGlobal },
    { flag: "i", label: t.flagIgnoreCase },
    { flag: "m", label: t.flagMultiline },
    { flag: "s", label: t.flagDotAll },
  ] as const;

  const result = useMemo(() => {
    if (!pattern) return { ok: true as const, matches: [] as MatchInfo[] };
    try {
      const re = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");
      const matches: MatchInfo[] = [];
      let m: RegExpExecArray | null;
      let iterations = 0;
      while ((m = re.exec(testString)) !== null && iterations < 1000) {
        matches.push({ text: m[0], index: m.index, groups: m.slice(1) });
        if (m[0] === "") re.lastIndex++;
        iterations++;
      }
      return { ok: true as const, matches };
    } catch (err) {
      return { ok: false as const, message: err instanceof Error ? err.message : "Invalid regex" };
    }
  }, [pattern, flags, testString]);

  function toggleFlag(flag: string) {
    setFlags((prev) => (prev.includes(flag) ? prev.replace(flag, "") : prev + flag));
  }

  const highlighted = useMemo(() => {
    if (!result.ok || result.matches.length === 0) return null;
    const parts: { text: string; isMatch: boolean }[] = [];
    let cursor = 0;
    for (const match of result.matches) {
      if (match.index > cursor) parts.push({ text: testString.slice(cursor, match.index), isMatch: false });
      parts.push({ text: match.text || "", isMatch: true });
      cursor = match.index + match.text.length;
    }
    if (cursor < testString.length) parts.push({ text: testString.slice(cursor), isMatch: false });
    return parts;
  }, [result, testString]);

  return (
    <div>
      <label htmlFor="regex-pattern" className="mb-1 block text-xs font-medium text-text-muted">
        {t.patternLabel}
      </label>
      <div className="flex items-center gap-2">
        <span className="font-mono text-text-muted">/</span>
        <input
          id="regex-pattern"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          spellCheck={false}
          className="code-surface flex-1 rounded-[10px] p-2 font-mono text-sm text-text-primary outline-none"
        />
        <span className="font-mono text-text-muted">/{flags}</span>
      </div>

      <div className="mt-2 flex flex-wrap gap-3">
        {flagOptions.map(({ flag, label }) => (
          <label key={flag} className="flex items-center gap-1 text-sm text-text-muted">
            <input type="checkbox" checked={flags.includes(flag)} onChange={() => toggleFlag(flag)} />
            {label} ({flag})
          </label>
        ))}
      </div>

      <label htmlFor="regex-test-string" className="mb-1 mt-4 block text-xs font-medium text-text-muted">
        {t.testStringLabel}
      </label>
      <textarea
        id="regex-test-string"
        value={testString}
        onChange={(e) => setTestString(e.target.value)}
        spellCheck={false}
        className="code-surface h-32 w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none"
      />

      {!result.ok && <p className="mt-2 text-sm text-red-400">{result.message}</p>}

      {result.ok && (
        <>
          <div className="mt-4">
            <span className="text-xs font-medium text-text-muted">
              {t.matchCountPattern.replace("{count}", String(result.matches.length))}{" "}
              {result.matches.length === 1 ? t.matchCountSuffix1 : t.matchCountSuffixN}
            </span>
            {highlighted && (
              <p className="code-surface mt-2 rounded-[10px] p-3 font-mono text-sm leading-relaxed text-text-primary">
                {highlighted.map((part, i) =>
                  part.isMatch ? (
                    <mark key={i} className="rounded bg-accent/30 px-0.5 text-accent">{part.text}</mark>
                  ) : (
                    <span key={i}>{part.text}</span>
                  )
                )}
              </p>
            )}
          </div>
          {result.matches.length > 0 && (
            <div className="mt-4 space-y-2">
              {result.matches.map((m, i) => (
                <div key={i} className="code-surface rounded-[10px] p-3 text-sm">
                  <span className="font-mono text-text-primary">{m.text}</span>
                  <span className="ml-2 text-xs text-text-muted">{t.atIndex} {m.index}</span>
                  {m.groups.length > 0 && (
                    <div className="mt-1 text-xs text-text-muted">
                      {t.groupsLabel} {m.groups.map((g, gi) => `$${gi + 1}=${g ?? "—"}`).join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
