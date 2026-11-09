/** Работа со временем сообщений в часовом поясе зрителя. Всё считается через Intl, без библиотек. */
export const ZONES = [
  "UTC", "Europe/London", "Europe/Berlin", "Europe/Moscow", "Asia/Yerevan", "Asia/Dubai", "Asia/Kolkata",
  "Asia/Kathmandu", "Asia/Tokyo", "Australia/Sydney", "Pacific/Auckland", "Pacific/Kiritimati", "Pacific/Pago_Pago",
  "America/New_York", "America/Chicago", "America/Los_Angeles", "America/Sao_Paulo",
];

export function offsetMinutes(zone: string, epochMs: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(epochMs));
  const g = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"), g("second"));
  return Math.round((asUtc - Math.floor(epochMs / 1000) * 1000) / 60000);
}

/** Календарная дата YYYY-MM-DD в часовом поясе. */
export function dayKey(zone: string, epochMs: number): string {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(epochMs));
  return p;
}

function dayNumber(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
}

export type DayLabel = "today" | "yesterday" | "weekday" | "date" | "future";

export function dayLabel(zone: string, nowMs: number, msgMs: number): { label: DayLabel; daysAgo: number } {
  const daysAgo = dayNumber(dayKey(zone, nowMs)) - dayNumber(dayKey(zone, msgMs));
  if (daysAgo < 0) return { label: "future", daysAgo };
  if (daysAgo === 0) return { label: "today", daysAgo };
  if (daysAgo === 1) return { label: "yesterday", daysAgo };
  if (daysAgo < 7) return { label: "weekday", daysAgo };
  return { label: "date", daysAgo };
}

export function formatLocal(zone: string, epochMs: number, locale = "en-GB"): string {
  return new Intl.DateTimeFormat(locale, { timeZone: zone, dateStyle: "medium", timeStyle: "medium", hourCycle: "h23" }).format(new Date(epochMs));
}

export function formatRelative(nowMs: number, msgMs: number, locale = "en"): string {
  const diffSec = Math.round((msgMs - nowMs) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const abs = Math.abs(diffSec);
  if (abs < 60) return rtf.format(diffSec, "second");
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  return rtf.format(Math.round(diffSec / 86400), "day");
}

export function parseInstant(text: string): number | null {
  const t = text.trim();
  if (!t) return null;
  if (/^\d{13}$/.test(t)) return Number(t);
  if (/^\d{10}$/.test(t)) return Number(t) * 1000;
  // Без указания пояса считаем время UTC, чтобы результат не зависел от машины тестировщика.
  const iso = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(t) ? t : `${t.replace(" ", "T")}Z`;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
}

export interface Transition {
  epochMs: number;
  fromOffset: number;
  toOffset: number;
}

/** Переходы на летнее и зимнее время в зоне за календарный год (точность до минуты). */
export function dstTransitions(zone: string, year: number): Transition[] {
  const out: Transition[] = [];
  const start = Date.UTC(year, 0, 1);
  const end = Date.UTC(year + 1, 0, 1);
  let prev = offsetMinutes(zone, start);
  for (let t = start + 86400000; t <= end; t += 86400000) {
    const cur = offsetMinutes(zone, t);
    if (cur !== prev) {
      let lo = t - 86400000, hi = t;
      while (hi - lo > 60000) {
        const mid = Math.floor((lo + hi) / 2 / 60000) * 60000;
        if (mid <= lo) break;
        if (offsetMinutes(zone, mid) === prev) lo = mid; else hi = mid;
      }
      out.push({ epochMs: hi, fromOffset: prev, toOffset: cur });
      prev = cur;
    }
  }
  return out;
}

/** Мгновение начала календарного дня (локальная полночь) для даты YYYY-MM-DD в зоне. */
export function localMidnight(zone: string, key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  let guess = Date.UTC(y, m - 1, d);
  for (let i = 0; i < 3; i++) guess = Date.UTC(y, m - 1, d) - offsetMinutes(zone, guess) * 60000;
  return guess;
}

export function edgeCaseInstants(zone: string, year: number): { name: string; epochMs: number }[] {
  const list: { name: string; epochMs: number }[] = [];
  for (const tr of dstTransitions(zone, year)) {
    const kind = tr.toOffset > tr.fromOffset ? "spring-forward" : "fall-back";
    list.push({ name: `${kind} -1 min`, epochMs: tr.epochMs - 60000 });
    list.push({ name: `${kind}`, epochMs: tr.epochMs });
    list.push({ name: `${kind} +1 min`, epochMs: tr.epochMs + 60000 });
  }
  const jan1 = localMidnight(zone, `${year}-01-01`);
  list.push({ name: "new year -1 s", epochMs: jan1 - 1000 });
  list.push({ name: "new year", epochMs: jan1 });
  return list;
}
