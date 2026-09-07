"use client";
import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { CakeIcon } from "@/components/icons/GameIcons";

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
          <p className="flex items-center justify-center gap-1.5 text-sm text-text-muted text-center">
            <CakeIcon size={13} /> Next birthday in {result.daysUntil} day{result.daysUntil !== 1 ? "s" : ""}
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
