import { mulberry32 } from "./backoff";

export interface HistoryParams {
  count: number;
  users: number;
  threadPct: number;
  reactionPct: number;
  attachmentPct: number;
  editPct: number;
  deletePct: number;
  mentionPct: number;
  longPct: number;
  startIso: string;
  spanHours: number;
  seed: number;
}

export const DEFAULT_HISTORY: HistoryParams = {
  count: 50,
  users: 6,
  threadPct: 15,
  reactionPct: 30,
  attachmentPct: 10,
  editPct: 8,
  deletePct: 3,
  mentionPct: 12,
  longPct: 5,
  startIso: "2026-11-02T08:00:00Z",
  spanHours: 72,
  seed: 42,
};

export const MAX_HISTORY = 100000;

export interface HistoryAttachment {
  name: string;
  mime: string;
  size: number;
}

export interface HistoryMessage {
  id: string;
  ts: string;
  seq: number;
  channel: string;
  user: { id: string; name: string };
  text: string;
  threadTs: string | null;
  reactions: { emoji: string; count: number }[];
  attachments: HistoryAttachment[];
  edited: boolean;
  deleted: boolean;
}

const NAMES = ["Anna Petrova", "Bob Smith", "Chen Wei", "Dmitry Orlov", "Eva Müller", "Farid Aliyev", "Grace Okafor", "Hiro Tanaka", "Ines García", "Jan Kowalski", "Katya Ivanova", "Liam O'Brien"];
const CHANNELS = ["general", "dev", "qa", "random", "releases"];
const SHORT = ["ok", "Thanks!", "+1", "on it", "Can you take a look?", "Deployed to staging", "LGTM", "Build is green", "Please re-run the tests", "Done", "I will check it tomorrow", "Standup in 5 minutes"];
const EMOJI = ["👍", "🎉", "👀", "❤️", "🚀", "😂", "✅", "🙏"];
const FILES: HistoryAttachment[] = [
  { name: "screenshot.png", mime: "image/png", size: 184320 },
  { name: "report.pdf", mime: "application/pdf", size: 912384 },
  { name: "build-log.txt", mime: "text/plain", size: 20480 },
  { name: "recording.mp4", mime: "video/mp4", size: 4718592 },
  { name: "data.csv", mime: "text/csv", size: 65536 },
];

function pick<T>(rnd: () => number, arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}

export function clampInt(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min;
  return Math.min(max, Math.max(min, Math.floor(v)));
}

export function generateHistory(p: HistoryParams): HistoryMessage[] {
  const count = clampInt(p.count, 1, MAX_HISTORY);
  const userCount = clampInt(p.users, 1, NAMES.length);
  const rnd = mulberry32(p.seed);
  const start = Date.parse(p.startIso);
  const t0 = Number.isFinite(start) ? start : Date.parse(DEFAULT_HISTORY.startIso);
  const span = Math.max(1, p.spanHours) * 3600_000;
  const users = NAMES.slice(0, userCount).map((name, i) => ({ id: "U" + String(1000 + i), name }));
  const hit = (pct: number) => rnd() * 100 < pct;

  // Времена: возрастающие, равномерно со случайным шагом.
  const step = span / count;
  const out: HistoryMessage[] = [];
  const roots: string[] = [];
  let t = t0;
  for (let i = 0; i < count; i++) {
    t += Math.max(1, Math.round(step * (0.2 + rnd() * 1.6)));
    const user = pick(rnd, users);
    const channel = CHANNELS[Math.floor(rnd() * CHANNELS.length)];
    const secs = Math.floor(t / 1000);
    const micro = String(i % 1000000).padStart(6, "0");
    const id = `${secs}.${micro}`;
    let text = pick(rnd, SHORT);
    if (hit(p.longPct)) {
      const words = 60 + Math.floor(rnd() * 140);
      text = Array.from({ length: words }, (_, k) => "word" + ((k * 7 + i) % 97)).join(" ");
    }
    if (hit(p.mentionPct) && users.length > 1) {
      const other = pick(rnd, users);
      text = `@${other.name.split(" ")[0].toLowerCase()} ${text}`;
    }
    const isThread = roots.length > 0 && hit(p.threadPct);
    const threadTs = isThread ? pick(rnd, roots) : null;
    if (!isThread) roots.push(id);
    const reactions = hit(p.reactionPct)
      ? Array.from(new Set([pick(rnd, EMOJI), pick(rnd, EMOJI)])).map((emoji) => ({ emoji, count: 1 + Math.floor(rnd() * 5) }))
      : [];
    const attachments = hit(p.attachmentPct) ? [pick(rnd, FILES)] : [];
    out.push({
      id, ts: new Date(t).toISOString(), seq: i + 1, channel, user, text,
      threadTs, reactions, attachments,
      edited: hit(p.editPct), deleted: hit(p.deletePct),
    });
  }
  return out;
}

function csvCell(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function historyToCsv(msgs: HistoryMessage[]): string {
  const head = ["id", "ts", "seq", "channel", "user_id", "user_name", "text", "thread_ts", "reactions", "attachments", "edited", "deleted"];
  const rows = msgs.map((m) => [
    m.id, m.ts, String(m.seq), m.channel, m.user.id, m.user.name, m.text, m.threadTs ?? "",
    m.reactions.map((r) => `${r.emoji}x${r.count}`).join(" "),
    m.attachments.map((a) => a.name).join(" "),
    String(m.edited), String(m.deleted),
  ].map(csvCell).join(","));
  return [head.join(","), ...rows].join("\n");
}

export type HistoryFormat = "json" | "ndjson" | "csv";

export function serializeHistory(msgs: HistoryMessage[], format: HistoryFormat): string {
  if (format === "json") return JSON.stringify(msgs, null, 2);
  if (format === "ndjson") return msgs.map((m) => JSON.stringify(m)).join("\n");
  return historyToCsv(msgs);
}
