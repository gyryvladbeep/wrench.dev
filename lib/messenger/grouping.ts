import { dayKey } from "./timestamps";

type Row = Record<string, unknown>;

export interface GroupingOptions {
  windowMinutes: number;
  zone: string;
  /** Номер последнего прочитанного сообщения (по seq или порядку); пусто - маркера нет. */
  lastReadSeq: number | null;
}

export interface Block {
  kind: "day" | "group" | "unread";
  label: string;
  author?: string;
  count?: number;
  firstTs?: number;
  lastTs?: number;
}

export interface GroupingReport {
  blocks: Block[];
  messages: number;
  groups: number;
  days: number;
  skipped: number;
}

function toMs(v: unknown): number | null {
  if (typeof v === "number") return v < 1e11 ? v * 1000 : v;
  if (typeof v === "string") {
    if (/^\d+(\.\d+)?$/.test(v)) { const n = Number(v); return n < 1e11 ? n * 1000 : n; }
    const ms = Date.parse(v);
    return Number.isNaN(ms) ? null : ms;
  }
  return null;
}

function authorOf(e: Row): string | null {
  const u = e.user;
  if (typeof u === "string" || typeof u === "number") return String(u);
  if (u && typeof u === "object") {
    const o = u as Row;
    const id = o.id ?? o.name;
    return id === undefined ? null : String(id);
  }
  return null;
}

function nameOf(e: Row): string {
  const u = e.user;
  if (u && typeof u === "object" && (u as Row).name) return String((u as Row).name);
  return authorOf(e) ?? "?";
}

/** Новая группа начинается при смене автора, паузе больше окна или смене дня. */
export function groupMessages(events: Row[], o: GroupingOptions): GroupingReport {
  const blocks: Block[] = [];
  let skipped = 0, messages = 0, groups = 0, days = 0;
  let curDay = "", cur: Block | null = null, lastAuthor: string | null = null, lastTs = 0, unreadPlaced = false;
  events.forEach((e, i) => {
    const ts = toMs(e.ts);
    const author = authorOf(e);
    if (ts === null || author === null) { skipped++; return; }
    messages++;
    const seq = typeof e.seq === "number" ? e.seq : i + 1;
    const day = dayKey(o.zone, ts);
    const newDay = day !== curDay;
    if (newDay) { blocks.push({ kind: "day", label: day }); curDay = day; days++; }
    if (!unreadPlaced && o.lastReadSeq !== null && seq > o.lastReadSeq) {
      blocks.push({ kind: "unread", label: "New messages" });
      unreadPlaced = true;
      cur = null;
    }
    const gap = ts - lastTs > o.windowMinutes * 60000;
    if (!cur || newDay || author !== lastAuthor || gap) {
      cur = { kind: "group", label: nameOf(e), author, count: 0, firstTs: ts, lastTs: ts };
      blocks.push(cur);
      groups++;
    }
    cur.count = (cur.count ?? 0) + 1;
    cur.lastTs = ts;
    lastAuthor = author;
    lastTs = ts;
  });
  return { blocks, messages, groups, days, skipped };
}

export const SAMPLE_GROUPING = `[
  { "seq": 1, "user": { "id": "u1", "name": "Anna" }, "ts": "2026-11-02T09:00:00Z" },
  { "seq": 2, "user": { "id": "u1", "name": "Anna" }, "ts": "2026-11-02T09:02:00Z" },
  { "seq": 3, "user": { "id": "u2", "name": "Bob" }, "ts": "2026-11-02T09:03:00Z" },
  { "seq": 4, "user": { "id": "u1", "name": "Anna" }, "ts": "2026-11-02T09:04:00Z" },
  { "seq": 5, "user": { "id": "u1", "name": "Anna" }, "ts": "2026-11-02T09:20:00Z" },
  { "seq": 6, "user": { "id": "u1", "name": "Anna" }, "ts": "2026-11-02T23:58:00Z" },
  { "seq": 7, "user": { "id": "u1", "name": "Anna" }, "ts": "2026-11-03T00:01:00Z" }
]`;
