import { Finding, finding, sortFindings } from "../mobile/findings";

export interface SequenceConfig {
  idKey: string;
  seqKey: string;
  tsKey: string;
  /** Необязательный ключ группы: последовательность проверяется внутри группы (например, channel). */
  groupKey: string;
}

export const DEFAULT_CONFIG: SequenceConfig = { idKey: "id", seqKey: "seq", tsKey: "ts", groupKey: "channel" };

type Row = Record<string, unknown>;

export function parseEvents(text: string): { events: Row[]; error?: string } {
  const t = text.trim();
  if (!t) return { events: [] };
  try {
    const v = JSON.parse(t);
    if (Array.isArray(v)) return { events: v.filter((x): x is Row => typeof x === "object" && x !== null) };
    if (typeof v === "object" && v !== null) return { events: [v as Row] };
    return { events: [], error: "Expected an array of events." };
  } catch {
    // NDJSON: по объекту в строке
    const events: Row[] = [];
    for (const [i, line] of t.split("\n").entries()) {
      if (!line.trim()) continue;
      try { events.push(JSON.parse(line) as Row); } catch { return { events: [], error: `Line ${i + 1} is not valid JSON.` }; }
    }
    return { events };
  }
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

export interface SequenceReport {
  total: number;
  groups: number;
  findings: Finding[];
}

function ranges(nums: number[]): string {
  const out: string[] = [];
  let start = nums[0], prev = nums[0];
  for (const n of nums.slice(1)) {
    if (n === prev + 1) { prev = n; continue; }
    out.push(start === prev ? `${start}` : `${start}-${prev}`);
    start = prev = n;
  }
  out.push(start === prev ? `${start}` : `${start}-${prev}`);
  return out.join(", ");
}

export function validateSequence(events: Row[], cfg: SequenceConfig): SequenceReport {
  const findings: Finding[] = [];
  const groups = new Map<string, Row[]>();
  for (const e of events) {
    const g = cfg.groupKey && e[cfg.groupKey] !== undefined ? String(e[cfg.groupKey]) : "(all)";
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(e);
  }

  const missingId = events.filter((e) => e[cfg.idKey] === undefined).length;
  if (missingId) findings.push(finding("error", "missing-id", `${missingId} event${missingId === 1 ? " has" : "s have"} no "${cfg.idKey}" field.`, `У событий без поля "${cfg.idKey}": ${missingId}.`));
  const missingSeq = events.filter((e) => e[cfg.seqKey] === undefined).length;
  if (missingSeq && missingSeq < events.length) findings.push(finding("warning", "missing-seq", `${missingSeq} event${missingSeq === 1 ? " has" : "s have"} no "${cfg.seqKey}" field.`, `У событий без поля "${cfg.seqKey}": ${missingSeq}.`));

  // Дубликаты id (во всём потоке)
  const seen = new Map<string, number>();
  for (const e of events) {
    const id = e[cfg.idKey];
    if (id === undefined) continue;
    seen.set(String(id), (seen.get(String(id)) ?? 0) + 1);
  }
  const dups = Array.from(seen).filter(([, n]) => n > 1);
  if (dups.length) findings.push(finding("error", "duplicate-id", `Duplicate ids (a retry or double delivery would show the message twice): ${dups.slice(0, 5).map(([id, n]) => `${id} x${n}`).join(", ")}.`, `Повторяющиеся id (при повторной доставке сообщение покажется дважды): ${dups.slice(0, 5).map(([id, n]) => `${id} x${n}`).join(", ")}.`));

  for (const [group, list] of groups) {
    const label = group === "(all)" ? "" : ` in ${cfg.groupKey} "${group}"`;
    const labelRu = group === "(all)" ? "" : ` в ${cfg.groupKey} "${group}"`;
    const seqs = list.map((e) => e[cfg.seqKey]).filter((s): s is number => typeof s === "number");
    if (seqs.length > 1) {
      // Порядок прихода: seq должен расти
      const back: string[] = [];
      let max = seqs[0];
      for (const s of seqs.slice(1)) {
        if (s < max) back.push(`${s} after ${max}`);
        else max = s;
      }
      if (back.length) findings.push(finding("warning", "out-of-order", `Events arrived out of order${label}: ${back.slice(0, 4).join("; ")}. The UI must reorder them by ${cfg.seqKey}.`, `События пришли не по порядку${labelRu}: ${back.slice(0, 4).join("; ")}. Интерфейс должен упорядочить их по ${cfg.seqKey}.`));
      const unique = Array.from(new Set(seqs)).sort((a, b) => a - b);
      const dupSeq = seqs.length - unique.length;
      if (dupSeq) findings.push(finding("warning", "duplicate-seq", `${dupSeq} repeated ${cfg.seqKey} value${dupSeq === 1 ? "" : "s"}${label}.`, `Повторяющихся значений ${cfg.seqKey}: ${dupSeq}${labelRu}.`));
      const missing: number[] = [];
      for (let n = unique[0]; n <= unique[unique.length - 1]; n++) if (!unique.includes(n)) missing.push(n);
      if (missing.length) findings.push(finding("error", "gap", `Missing ${cfg.seqKey} ${ranges(missing.slice(0, 50))}${label}: the client should detect the gap and request a resync.`, `Пропущены ${cfg.seqKey} ${ranges(missing.slice(0, 50))}${labelRu}: клиент должен заметить пропуск и запросить пересинхронизацию.`));
    }
    // Время не должно убывать при росте seq
    const pairs = list.map((e) => ({ s: e[cfg.seqKey], t: toMs(e[cfg.tsKey]) })).filter((p): p is { s: number; t: number } => typeof p.s === "number" && p.t !== null).sort((a, b) => a.s - b.s);
    const skew: string[] = [];
    for (let i = 1; i < pairs.length; i++) if (pairs[i].t < pairs[i - 1].t) skew.push(`${cfg.seqKey} ${pairs[i].s}`);
    if (skew.length) findings.push(finding("warning", "timestamp-regression", `Timestamp goes back while ${cfg.seqKey} grows at ${skew.slice(0, 4).join(", ")}${label}: clock skew between senders.`, `Время идёт назад при росте ${cfg.seqKey} у ${skew.slice(0, 4).join(", ")}${labelRu}: рассинхронизация часов отправителей.`));
    const badTs = list.filter((e) => e[cfg.tsKey] !== undefined && toMs(e[cfg.tsKey]) === null).length;
    if (badTs) findings.push(finding("warning", "bad-timestamp", `${badTs} event${badTs === 1 ? " has" : "s have"} an unparseable "${cfg.tsKey}"${label}.`, `Событий с нечитаемым "${cfg.tsKey}": ${badTs}${labelRu}.`));
  }
  if (findings.length === 0) findings.push(finding("info", "ok", "No ordering problems found.", "Проблем с порядком не найдено."));
  return { total: events.length, groups: groups.size, findings: sortFindings(findings) };
}

export const SAMPLE_EVENTS = `[
  { "id": "m1", "channel": "general", "seq": 1, "ts": "2026-11-09T10:00:00Z" },
  { "id": "m2", "channel": "general", "seq": 2, "ts": "2026-11-09T10:00:05Z" },
  { "id": "m4", "channel": "general", "seq": 4, "ts": "2026-11-09T10:00:09Z" },
  { "id": "m3", "channel": "general", "seq": 3, "ts": "2026-11-09T10:00:07Z" },
  { "id": "m4", "channel": "general", "seq": 4, "ts": "2026-11-09T10:00:09Z" },
  { "id": "m7", "channel": "general", "seq": 7, "ts": "2026-11-09T09:59:00Z" },
  { "id": "r1", "channel": "random", "seq": 1, "ts": "2026-11-09T10:01:00Z" }
]`;
