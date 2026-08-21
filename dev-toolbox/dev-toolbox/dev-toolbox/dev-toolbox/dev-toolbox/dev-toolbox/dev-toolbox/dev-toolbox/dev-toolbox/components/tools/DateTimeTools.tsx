"use client";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

// ─── Age Calculator ───────────────────────────────────────────────────────────
export function AgeCalculatorTool({ dict }: { dict: Dictionary }) {
  const [birth, setBirth] = useState("1990-06-15");
  const [asOf, setAsOf] = useState(() => new Date().toISOString().slice(0, 10));

  const result = useMemo(() => {
    if (!birth) return null;
    const b = new Date(birth); const a = new Date(asOf);
    if (isNaN(b.getTime()) || isNaN(a.getTime()) || b > a) return null;
    let years = a.getFullYear() - b.getFullYear();
    let months = a.getMonth() - b.getMonth();
    let days = a.getDate() - b.getDate();
    if (days < 0) { months--; days += new Date(a.getFullYear(), a.getMonth(), 0).getDate(); }
    if (months < 0) { years--; months += 12; }
    const nextBirthday = new Date(a.getFullYear(), b.getMonth(), b.getDate());
    if (nextBirthday <= a) nextBirthday.setFullYear(a.getFullYear() + 1);
    const daysUntil = Math.ceil((nextBirthday.getTime() - a.getTime()) / 86400000);
    const totalDays = Math.floor((a.getTime() - b.getTime()) / 86400000);
    return { years, months, days, totalDays, daysUntil };
  }, [birth, asOf]);

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">Date of birth</label>
          <input type="date" value={birth} onChange={(e) => setBirth(e.target.value)}
            className="code-surface w-full rounded-[10px] p-3 text-sm text-text-primary outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">Age as of</label>
          <input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)}
            className="code-surface w-full rounded-[10px] p-3 text-sm text-text-primary outline-none" />
        </div>
      </div>

      {result ? (
        <div className="space-y-3">
          <div className="rounded-[10px] border border-accent/30 bg-accent/10 p-5 text-center">
            <p className="text-4xl font-bold text-accent">{result.years}</p>
            <p className="text-sm text-text-muted">years old</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Months", value: result.months },
              { label: "Days", value: result.days },
              { label: "Total days", value: result.totalDays.toLocaleString() },
            ].map((s) => (
              <div key={s.label} className="code-surface rounded-[10px] p-4 text-center">
                <p className="text-2xl font-semibold text-text-primary">{s.value}</p>
                <p className="text-xs text-text-muted">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-text-muted text-center">
            🎂 Next birthday in {result.daysUntil} day{result.daysUntil !== 1 ? "s" : ""}
          </p>
        </div>
      ) : (
        <p className="text-sm text-text-muted">Enter a valid birth date to calculate age.</p>
      )}
    </div>
  );
}

// ─── Date Difference ─────────────────────────────────────────────────────────
export function DateDifferenceTool({ dict }: { dict: Dictionary }) {
  const [start, setStart] = useState("2020-01-01");
  const [end, setEnd] = useState(() => new Date().toISOString().slice(0, 10));

  const result = useMemo(() => {
    if (!start || !end) return null;
    const a = new Date(start); const b = new Date(end);
    if (isNaN(a.getTime()) || isNaN(b.getTime())) return null;
    const [from, to] = a <= b ? [a, b] : [b, a];
    const msTotal = to.getTime() - from.getTime();
    const totalDays = Math.floor(msTotal / 86400000);
    const totalHours = Math.floor(msTotal / 3600000);
    const totalMinutes = Math.floor(msTotal / 60000);
    const totalWeeks = Math.floor(totalDays / 7);
    let years = to.getFullYear() - from.getFullYear();
    let months = to.getMonth() - from.getMonth();
    let days = to.getDate() - from.getDate();
    if (days < 0) { months--; days += new Date(to.getFullYear(), to.getMonth(), 0).getDate(); }
    if (months < 0) { years--; months += 12; }
    return { years, months, days, totalDays, totalHours, totalMinutes, totalWeeks };
  }, [start, end]);

  const stats = result ? [
    { label: "Years", value: result.years },
    { label: "Months", value: result.months },
    { label: "Days", value: result.days },
    { label: "Total days", value: result.totalDays.toLocaleString() },
    { label: "Total weeks", value: result.totalWeeks.toLocaleString() },
    { label: "Total hours", value: result.totalHours.toLocaleString() },
  ] : [];

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">Start date</label>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)}
            className="code-surface w-full rounded-[10px] p-3 text-sm text-text-primary outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">End date</label>
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)}
            className="code-surface w-full rounded-[10px] p-3 text-sm text-text-primary outline-none" />
        </div>
      </div>

      {result ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="code-surface rounded-[10px] p-4 text-center">
              <p className="text-2xl font-semibold text-text-primary">{s.value}</p>
              <p className="text-xs text-text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-muted">Enter two valid dates to calculate the difference.</p>
      )}
    </div>
  );
}

// ─── Cron Expression Parser ───────────────────────────────────────────────────
const CRON_PRESETS = [
  { label: "Every minute",    value: "* * * * *" },
  { label: "Every hour",      value: "0 * * * *" },
  { label: "Every day at midnight", value: "0 0 * * *" },
  { label: "Every Monday at 9am",   value: "0 9 * * 1" },
  { label: "Every 1st of month",    value: "0 0 1 * *" },
];

function getNextRuns(expr: string, count = 5): Date[] | null {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const [min, hour, dom, mon, dow] = parts;

  function matches(val: number, field: string, max: number): boolean {
    if (field === "*") return true;
    for (const part of field.split(",")) {
      if (part.includes("/")) {
        const [, step] = part.split("/");
        if (val % parseInt(step) === 0) return true;
      } else if (part.includes("-")) {
        const [lo, hi] = part.split("-").map(Number);
        if (val >= lo && val <= hi) return true;
      } else if (parseInt(part) === val) return true;
    }
    return false;
  }

  const runs: Date[] = [];
  const d = new Date(); d.setSeconds(0, 0);
  let iterations = 0;
  while (runs.length < count && iterations < 100000) {
    d.setMinutes(d.getMinutes() + 1);
    iterations++;
    if (
      matches(d.getMinutes(), min, 59) &&
      matches(d.getHours(), hour, 23) &&
      matches(d.getDate(), dom, 31) &&
      matches(d.getMonth() + 1, mon, 12) &&
      matches(d.getDay(), dow, 6)
    ) {
      runs.push(new Date(d));
    }
  }
  return runs;
}

function explainField(field: string, unit: string): string {
  if (field === "*") return `every ${unit}`;
  if (field.startsWith("*/")) return `every ${field.slice(2)} ${unit}s`;
  return `at ${unit} ${field}`;
}

function explainCron(expr: string): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return "Invalid cron expression (need 5 fields)";
  const [min, hour, dom, mon, dow] = parts;
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  let explanation = "Runs ";
  if (min === "*" && hour === "*") explanation += "every minute";
  else if (min !== "*" && hour === "*") explanation += `at minute ${min} of every hour`;
  else explanation += `at ${hour.padStart(2, "0")}:${min.padStart(2, "0")}`;
  if (dow !== "*") explanation += ` on ${dow.split(",").map((d) => days[parseInt(d)] || d).join(", ")}`;
  if (dom !== "*") explanation += ` on day ${dom} of the month`;
  if (mon !== "*") explanation += ` in ${mon.split(",").map((m) => months[parseInt(m) - 1] || m).join(", ")}`;
  return explanation;
}

export function CronExpressionTool({ dict }: { dict: Dictionary }) {
  const [expr, setExpr] = useState("0 9 * * 1-5");

  const explanation = useMemo(() => explainCron(expr), [expr]);
  const nextRuns = useMemo(() => getNextRuns(expr), [expr]);

  return (
    <div>
      <div className="mb-3">
        <label className="mb-1 block text-xs font-medium text-text-muted">Cron expression</label>
        <div className="flex gap-2">
          <input value={expr} onChange={(e) => setExpr(e.target.value)} spellCheck={false}
            placeholder="* * * * *"
            className="code-surface flex-1 rounded-[10px] p-3 font-mono text-lg text-text-primary outline-none" />
          <CopyButton value={expr} label={dict.common.copy} copiedLabel={dict.common.copied} />
        </div>
        <div className="mt-1 grid grid-cols-5 gap-1 text-xs text-center text-text-muted">
          {["min","hour","day","month","weekday"].map((f) => <span key={f}>{f}</span>)}
        </div>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-2 mb-4">
        {CRON_PRESETS.map((p) => (
          <button key={p.value} onClick={() => setExpr(p.value)}
            className="rounded-full bg-surface px-3 py-1 text-xs text-text-muted hover:bg-surface-hover hover:text-text-primary">
            {p.label}
          </button>
        ))}
      </div>

      {/* Explanation */}
      <div className="code-surface rounded-[10px] p-4 mb-4">
        <p className="text-sm text-text-primary">{explanation}</p>
      </div>

      {/* Next runs */}
      {nextRuns && nextRuns.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-text-muted">Next {nextRuns.length} executions</p>
          <div className="space-y-1">
            {nextRuns.map((d, i) => (
              <div key={i} className="flex items-center gap-3 rounded-[10px] bg-surface px-4 py-2 text-sm">
                <span className="text-text-muted">{i + 1}.</span>
                <span className="font-mono text-text-primary">{d.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
