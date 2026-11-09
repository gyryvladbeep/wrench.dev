import { Finding, finding, sortFindings } from "../mobile/findings";

type Row = Record<string, unknown>;

export const STATUSES = ["draft", "sending", "sent", "delivered", "read", "failed", "retrying"] as const;
export type SendStatus = (typeof STATUSES)[number];

/** Допустимые переходы статуса исходящего сообщения. */
export const TRANSITIONS: Record<SendStatus, SendStatus[]> = {
  draft: ["sending"],
  sending: ["sent", "failed"],
  sent: ["delivered", "read", "failed"],
  delivered: ["read"],
  read: [],
  failed: ["retrying", "sending"],
  retrying: ["sending", "sent", "failed"],
};

export interface SendStatusOptions {
  idKey: string;
  statusKey: string;
  tsKey: string;
  /** Сообщение в sending или retrying дольше этого времени (мс) считается зависшим. */
  stuckMs: number;
}

export const DEFAULT_SEND_OPTIONS: SendStatusOptions = { idKey: "id", statusKey: "status", tsKey: "ts", stuckMs: 30000 };

export interface SendReport {
  messages: { id: string; path: string[]; final: string }[];
  findings: Finding[];
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

export function validateSendStatuses(events: Row[], o: SendStatusOptions): SendReport {
  const findings: Finding[] = [];
  const byId = new Map<string, { status: string; ts: number | null }[]>();
  let latest = 0;
  events.forEach((e, i) => {
    const id = e[o.idKey];
    const status = e[o.statusKey];
    if (id === undefined || id === null) { findings.push(finding("warning", "missing-id", `Event ${i + 1} has no "${o.idKey}".`, `У события ${i + 1} нет поля "${o.idKey}".`)); return; }
    if (typeof status !== "string") { findings.push(finding("warning", "missing-status", `Event ${i + 1} has no "${o.statusKey}".`, `У события ${i + 1} нет поля "${o.statusKey}".`)); return; }
    const ts = toMs(e[o.tsKey]);
    if (ts !== null) latest = Math.max(latest, ts);
    const key = String(id);
    if (!byId.has(key)) byId.set(key, []);
    byId.get(key)!.push({ status, ts });
  });

  const messages: SendReport["messages"] = [];
  for (const [id, list] of byId) {
    messages.push({ id, path: list.map((x) => x.status), final: list[list.length - 1].status });
    for (let i = 0; i < list.length; i++) {
      const cur = list[i].status;
      if (!(STATUSES as readonly string[]).includes(cur)) {
        findings.push(finding("error", "unknown-status", `Message ${id}: unknown status "${cur}".`, `Сообщение ${id}: неизвестный статус "${cur}".`));
        continue;
      }
      if (i === 0) continue;
      const prev = list[i - 1].status;
      if (prev === cur) {
        findings.push(finding("info", "duplicate-status", `Message ${id}: status "${cur}" repeats; a duplicate update can flicker the UI.`, `Сообщение ${id}: статус "${cur}" повторяется, дубль обновления может мигать в интерфейсе.`));
      } else if ((STATUSES as readonly string[]).includes(prev) && !TRANSITIONS[prev as SendStatus].includes(cur as SendStatus)) {
        findings.push(finding("error", "illegal-transition", `Message ${id}: ${prev} -> ${cur} is not allowed.`, `Сообщение ${id}: переход ${prev} -> ${cur} недопустим.`));
      }
      const a = list[i - 1].ts, b = list[i].ts;
      if (a !== null && b !== null && b < a) {
        findings.push(finding("warning", "timestamp-regression", `Message ${id}: time goes back at ${prev} -> ${cur}.`, `Сообщение ${id}: время идёт назад на переходе ${prev} -> ${cur}.`));
      }
    }
    const last = list[list.length - 1];
    if ((last.status === "sending" || last.status === "retrying") && last.ts !== null && latest - last.ts > o.stuckMs) {
      findings.push(finding("warning", "stuck", `Message ${id} has been "${last.status}" for ${Math.round((latest - last.ts) / 1000)} s by the last event; check the timeout and the retry.`, `Сообщение ${id} в статусе "${last.status}" уже ${Math.round((latest - last.ts) / 1000)} с к последнему событию: проверьте таймаут и повтор.`));
    }
    if (last.status === "failed") {
      findings.push(finding("info", "ends-failed", `Message ${id} ends in "failed": the UI must show a retry action.`, `Сообщение ${id} закончилось в "failed": в интерфейсе должно быть действие повтора.`));
    }
  }
  if (findings.length === 0 && messages.length > 0) {
    findings.push(finding("info", "ok", "All status paths are valid.", "Все цепочки статусов допустимы."));
  }
  return { messages, findings: sortFindings(findings) };
}

export const SAMPLE_SEND = `[
  { "id": "a1", "status": "draft", "ts": "2026-11-09T10:00:00Z" },
  { "id": "a1", "status": "sending", "ts": "2026-11-09T10:00:01Z" },
  { "id": "a1", "status": "sent", "ts": "2026-11-09T10:00:02Z" },
  { "id": "a1", "status": "delivered", "ts": "2026-11-09T10:00:03Z" },
  { "id": "a1", "status": "read", "ts": "2026-11-09T10:00:20Z" },
  { "id": "b2", "status": "sending", "ts": "2026-11-09T10:00:05Z" },
  { "id": "b2", "status": "failed", "ts": "2026-11-09T10:00:15Z" },
  { "id": "b2", "status": "sent", "ts": "2026-11-09T10:00:16Z" },
  { "id": "c3", "status": "sending", "ts": "2026-11-09T10:00:10Z" },
  { "id": "d4", "status": "read", "ts": "2026-11-09T10:01:30Z" },
  { "id": "d4", "status": "sending", "ts": "2026-11-09T10:01:40Z" }
]`;
