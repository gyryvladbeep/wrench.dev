"use client";

import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";

const VALID_SAMPLE = `{"name": "Ada Lovelace", "born": 1815, "tags": ["math", "computing"]}`;
const INVALID_SAMPLE = `{"name": "Ada Lovelace", "born": 1815,}`; // trailing comma — common real-world mistake

/** Converts a character offset into a 1-indexed line/column, so the error
 *  message can point at roughly where to look instead of just a raw offset. */
function getLineColumn(text: string, position: number): { line: number; column: number } {
  const upToError = text.slice(0, Math.max(0, position));
  const lines = upToError.split("\n");
  return { line: lines.length, column: lines[lines.length - 1].length + 1 };
}

function describeValue(value: unknown, t: Dictionary["tools"]["jsonValidator"]): string {
  const count = Array.isArray(value)
    ? value.length
    : typeof value === "object" && value !== null
    ? Object.keys(value).length
    : null;

  if (Array.isArray(value)) {
    const suffix = count === 1 ? t.describeArraySuffix1 : t.describeArraySuffixN;
    return t.describeArrayPattern.replace("{count}", String(count)) + " " + suffix;
  }
  if (value === null) return t.describeNull;
  if (typeof value === "object") {
    const suffix = count === 1 ? t.describeObjectSuffix1 : t.describeObjectSuffixN;
    return t.describeObjectPattern.replace("{count}", String(count)) + " " + suffix;
  }
  if (typeof value === "string") return t.describeTypeofString;
  if (typeof value === "number") return t.describeTypeofNumber;
  if (typeof value === "boolean") return t.describeTypeofBoolean;
  return typeof value;
}

export function JsonValidatorTool({ dict }: { dict: Dictionary }) {
  const [input, setInput] = useState(VALID_SAMPLE);
  const t = dict.tools.jsonValidator;

  const result = useMemo(() => {
    if (!input.trim()) return { state: "empty" as const };
    try {
      const parsed = JSON.parse(input);
      return { state: "valid" as const, summary: describeValue(parsed, t) };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid JSON";
      const posMatch = message.match(/position (\d+)/);
      const lineColMatch = message.match(/line (\d+) column (\d+)/i);
      let location: { line: number; column: number } | null = null;
      if (lineColMatch) {
        location = { line: Number(lineColMatch[1]), column: Number(lineColMatch[2]) };
      } else if (posMatch) {
        location = getLineColumn(input, Number(posMatch[1]));
      }
      return { state: "invalid" as const, message, location };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  return (
    <div>
      <div className="flex justify-end gap-2 text-xs">
        <button
          onClick={() => setInput(VALID_SAMPLE)}
          className="rounded-[10px] bg-surface px-2 py-1 text-text-muted hover:bg-surface-hover"
        >
          {t.loadValidExample}
        </button>
        <button
          onClick={() => setInput(INVALID_SAMPLE)}
          className="rounded-[10px] bg-surface px-2 py-1 text-text-muted hover:bg-surface-hover"
        >
          {t.loadInvalidExample}
        </button>
      </div>

      <label htmlFor="json-validator-input" className="mb-1 mt-3 block text-xs font-medium text-text-muted">
        {dict.common.input}
      </label>
      <textarea
        id="json-validator-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        spellCheck={false}
        className="code-surface h-64 w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none"
        placeholder={t.placeholder}
      />

      <div className="mt-4">
        {result.state === "empty" && <p className="text-sm text-text-muted">{t.emptyHint}</p>}

        {result.state === "valid" && (
          <div className="flex items-center gap-2 rounded-[10px] border border-accent/30 bg-accent/10 p-3 text-sm">
            <span className="text-accent">{t.validHeading}</span>
            <span className="text-text-muted">
              {t.validSummaryPrefix} {result.summary}.
            </span>
          </div>
        )}

        {result.state === "invalid" && (
          <div className="rounded-[10px] border border-red-500/30 bg-red-500/10 p-3 text-sm">
            <p className="font-medium text-red-400">{t.invalidHeading}</p>
            <p className="mt-1 text-text-muted">{result.message}</p>
            {result.location && (
              <p className="mt-1 text-text-muted">
                {t.aroundLine
                  .replace("{line}", String(result.location.line))
                  .replace("{column}", String(result.location.column))}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
