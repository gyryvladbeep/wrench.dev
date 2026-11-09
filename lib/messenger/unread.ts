export interface UnreadOptions {
  /** Учитывать ли заглушенные каналы в общем бейдже. */
  mutedCount: boolean;
  /** Выше этого значения бейдж показывает "N+". */
  cap: number;
}

export const DEFAULT_UNREAD_OPTIONS: UnreadOptions = { mutedCount: false, cap: 99 };

export interface ChannelState {
  channel: string;
  unread: number;
  mentions: number;
  muted: boolean;
  readUpTo: number;
}

export interface UnreadStep {
  index: number;
  description: string;
  total: number;
  mentions: number;
  badge: string;
}

export interface UnreadResult {
  steps: UnreadStep[];
  channels: ChannelState[];
  notes: string[];
}

type Row = Record<string, unknown>;

interface Msg { mention: boolean; self: boolean; deleted: boolean }
interface Chan { msgs: Map<number, Msg>; readUpTo: number; muted: boolean }

export function formatBadge(n: number, cap: number): string {
  if (n <= 0) return "";
  return n > cap ? `${cap}+` : String(n);
}

function counts(c: Chan): { unread: number; mentions: number } {
  let unread = 0, mentions = 0;
  for (const [n, m] of c.msgs) {
    if (n <= c.readUpTo || m.self || m.deleted) continue;
    unread++;
    if (m.mention) mentions++;
  }
  return { unread, mentions };
}

/**
 * События: { t: "msg"|"read"|"delete"|"mute"|"unmute", ch, n, mention?, self? }.
 * Считает ожидаемые счётчики после каждого шага, чтобы сверить с интерфейсом.
 */
export function simulateUnread(events: Row[], opts: UnreadOptions): UnreadResult {
  const chans = new Map<string, Chan>();
  const notes: string[] = [];
  const steps: UnreadStep[] = [];
  const get = (ch: string): Chan => {
    let c = chans.get(ch);
    if (!c) { c = { msgs: new Map(), readUpTo: 0, muted: false }; chans.set(ch, c); }
    return c;
  };
  const totals = () => {
    let total = 0, mentions = 0;
    for (const c of chans.values()) {
      const k = counts(c);
      if (!c.muted || opts.mutedCount) total += k.unread;
      mentions += k.mentions;
    }
    return { total, mentions };
  };

  events.forEach((e, i) => {
    const t = String(e.t ?? "");
    const ch = String(e.ch ?? "");
    const n = Number(e.n);
    let desc = `${t} ${ch}`;
    if (!ch) { notes.push(`Event ${i + 1}: missing "ch" (channel).`); }
    else if (t === "msg") {
      if (!Number.isFinite(n)) notes.push(`Event ${i + 1}: message without a numeric "n".`);
      else {
        const c = get(ch);
        if (c.msgs.has(n)) notes.push(`Event ${i + 1}: message ${n} in ${ch} is delivered twice; it is counted once.`);
        c.msgs.set(n, { mention: Boolean(e.mention), self: Boolean(e.self), deleted: false });
        desc = `msg #${n} in ${ch}${e.mention ? " (mention)" : ""}${e.self ? " (own)" : ""}`;
      }
    } else if (t === "read") {
      const c = get(ch);
      if (!Number.isFinite(n)) notes.push(`Event ${i + 1}: read without a numeric "n".`);
      else if (n < c.readUpTo) notes.push(`Event ${i + 1}: read pointer ${n} is behind ${c.readUpTo} in ${ch}; the pointer only moves forward, so it is ignored.`);
      else c.readUpTo = n;
      desc = `read up to #${n} in ${ch}`;
    } else if (t === "delete") {
      const m = get(ch).msgs.get(n);
      if (m) m.deleted = true; else notes.push(`Event ${i + 1}: deleting unknown message ${n} in ${ch}.`);
      desc = `delete #${n} in ${ch}`;
    } else if (t === "mute" || t === "unmute") {
      get(ch).muted = t === "mute";
    } else {
      notes.push(`Event ${i + 1}: unknown type "${t}".`);
    }
    const tt = totals();
    steps.push({ index: i + 1, description: desc, total: tt.total, mentions: tt.mentions, badge: formatBadge(tt.total, opts.cap) });
  });

  const channels: ChannelState[] = [...chans.entries()].map(([channel, c]) => ({ channel, ...counts(c), muted: c.muted, readUpTo: c.readUpTo }));
  return { steps, channels, notes };
}

export const SAMPLE_UNREAD = `[
  { "t": "msg", "ch": "general", "n": 1 },
  { "t": "msg", "ch": "general", "n": 2, "mention": true },
  { "t": "msg", "ch": "dev", "n": 1 },
  { "t": "msg", "ch": "general", "n": 3, "self": true },
  { "t": "mute", "ch": "dev" },
  { "t": "msg", "ch": "dev", "n": 2 },
  { "t": "read", "ch": "general", "n": 1 },
  { "t": "delete", "ch": "general", "n": 2 },
  { "t": "read", "ch": "general", "n": 0 }
]`;
