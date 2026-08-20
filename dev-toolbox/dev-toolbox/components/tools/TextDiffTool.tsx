"use client";
import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";

type LineStatus = "added" | "removed" | "same";
interface DiffLine { text: string; status: LineStatus; }

function lineDiff(a: string, b: string): DiffLine[] {
  const linesA = a.split("\n");
  const linesB = b.split("\n");
  // Simple LCS-based diff
  const m = linesA.length, n = linesB.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = linesA[i] === linesB[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);

  const result: DiffLine[] = [];
  let i = 0, j = 0;
  while (i < m || j < n) {
    if (i < m && j < n && linesA[i] === linesB[j]) {
      result.push({ text: linesA[i], status: "same" }); i++; j++;
    } else if (j < n && (i >= m || dp[i][j + 1] >= dp[i + 1][j])) {
      result.push({ text: linesB[j], status: "added" }); j++;
    } else {
      result.push({ text: linesA[i], status: "removed" }); i++;
    }
  }
  return result;
}

const STATUS_STYLE: Record<LineStatus, string> = {
  added:   "bg-green-500/15 text-green-300 border-l-2 border-green-500",
  removed: "bg-red-500/15 text-red-300 border-l-2 border-red-500",
  same:    "text-text-muted",
};
const STATUS_PREFIX: Record<LineStatus, string> = { added: "+ ", removed: "- ", same: "  " };

export function TextDiffTool({ dict }: { dict: Dictionary }) {
  const [left, setLeft] = useState("The quick brown fox\njumps over the lazy dog\nHello world");
  const [right, setRight] = useState("The quick brown fox\nleaps over the lazy cat\nHello world\nNew line added");

  const diff = useMemo(() => lineDiff(left, right), [left, right]);
  const added   = diff.filter((l) => l.status === "added").length;
  const removed = diff.filter((l) => l.status === "removed").length;

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">Original (A)</label>
          <textarea value={left} onChange={(e) => setLeft(e.target.value)} spellCheck={false} rows={8}
            className="code-surface w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">Modified (B)</label>
          <textarea value={right} onChange={(e) => setRight(e.target.value)} spellCheck={false} rows={8}
            className="code-surface w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none" />
        </div>
      </div>

      <div className="mb-2 flex items-center gap-4 text-xs">
        <span className="text-green-400">+{added} added</span>
        <span className="text-red-400">-{removed} removed</span>
        {added === 0 && removed === 0 && <span className="text-accent">✓ Identical</span>}
      </div>

      <div className="code-surface rounded-[10px] overflow-hidden">
        {diff.map((line, i) => (
          <div key={i} className={`flex gap-2 px-3 py-0.5 font-mono text-sm ${STATUS_STYLE[line.status]}`}>
            <span className="select-none w-4 shrink-0 opacity-60">{STATUS_PREFIX[line.status]}</span>
            <span className="whitespace-pre-wrap break-all">{line.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
