"use client";
import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { CopyButton } from "@/components/CopyButton";
import { DEFAULT_HISTORY, HistoryFormat, MAX_HISTORY, clampInt, generateHistory, serializeHistory } from "@/lib/messenger/history";
import { download, primaryBtn, Field, NumberField, Panel, Stat, inputClass } from "./messenger/ui";

type Key = "count" | "users" | "threadPct" | "reactionPct" | "attachmentPct" | "editPct" | "deletePct" | "mentionPct" | "longPct" | "spanHours" | "seed";

export function ChatHistoryGeneratorTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [v, setV] = useState<Record<Key, string>>({
    count: "50", users: "6", threadPct: "15", reactionPct: "30", attachmentPct: "10", editPct: "8", deletePct: "3", mentionPct: "12", longPct: "5", spanHours: "72", seed: "42",
  });
  const [start, setStart] = useState("2026-11-02T08:00:00Z");
  const [format, setFormat] = useState<HistoryFormat>("json");

  const params = useMemo(() => ({
    ...DEFAULT_HISTORY,
    count: clampInt(Number(v.count), 1, MAX_HISTORY),
    users: clampInt(Number(v.users), 1, 12),
    threadPct: Number(v.threadPct), reactionPct: Number(v.reactionPct), attachmentPct: Number(v.attachmentPct),
    editPct: Number(v.editPct), deletePct: Number(v.deletePct), mentionPct: Number(v.mentionPct), longPct: Number(v.longPct),
    spanHours: Number(v.spanHours) || 1, seed: Number(v.seed) || 0, startIso: start,
  }), [v, start]);

  const msgs = useMemo(() => generateHistory(params), [params]);
  const out = useMemo(() => serializeHistory(msgs, format), [msgs, format]);
  const preview = useMemo(() => serializeHistory(msgs.slice(0, 3), format), [msgs, format]);
  const ext = format === "ndjson" ? "ndjson" : format;
  const set = (k: Key) => (val: string) => setV({ ...v, [k]: val });
  const f = (k: Key, label: string, max?: number) => <NumberField key={k} id={`ch-${k}`} label={label} value={v[k]} onChange={set(k)} min={0} max={max} />;

  return (
    <div className="space-y-5 max-w-4xl">
      <Panel cols="sm:grid-cols-3">
        {f("count", isRu ? `Сообщений (до ${MAX_HISTORY})` : `Messages (up to ${MAX_HISTORY})`, MAX_HISTORY)}
        {f("users", isRu ? "Пользователей (1-12)" : "Users (1-12)", 12)}
        {f("seed", "Seed")}
        {f("threadPct", isRu ? "Ответы в тредах, %" : "Thread replies, %", 100)}
        {f("reactionPct", isRu ? "С реакциями, %" : "With reactions, %", 100)}
        {f("attachmentPct", isRu ? "С вложениями, %" : "With attachments, %", 100)}
        {f("editPct", isRu ? "Изменённые, %" : "Edited, %", 100)}
        {f("deletePct", isRu ? "Удалённые, %" : "Deleted, %", 100)}
        {f("mentionPct", isRu ? "С упоминаниями, %" : "With mentions, %", 100)}
        {f("longPct", isRu ? "Длинные, %" : "Long messages, %", 100)}
        {f("spanHours", isRu ? "Период, часов" : "Span, hours")}
        <Field id="ch-start" label={isRu ? "Начало периода (ISO)" : "Start (ISO)"}>
          <input id="ch-start" value={start} onChange={(e) => setStart(e.target.value)} className={inputClass} />
        </Field>
        <Field id="ch-format" label={isRu ? "Формат" : "Format"}>
          <select id="ch-format" value={format} onChange={(e) => setFormat(e.target.value as HistoryFormat)} className={inputClass}>
            <option value="json">JSON</option><option value="ndjson">NDJSON</option><option value="csv">CSV</option>
          </select>
        </Field>
      </Panel>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat id="ch-count" label={isRu ? "Сообщений" : "Messages"} value={msgs.length} />
        <Stat id="ch-threads" label={isRu ? "В тредах" : "In threads"} value={msgs.filter((m) => m.threadTs).length} />
        <Stat id="ch-attachments" label={isRu ? "Вложений" : "Attachments"} value={msgs.reduce((n, m) => n + m.attachments.length, 0)} />
        <Stat id="ch-size" label={isRu ? "Размер, КБ" : "Size, KB"} value={Math.round(out.length / 1024)} />
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" data-testid="ch-download" className={primaryBtn} onClick={() => download(`chat-history-${msgs.length}.${ext}`, out, "text/plain")}>{isRu ? "Скачать" : "Download"}</button>
        {out.length < 500_000 ? <CopyButton value={out} /> : null}
      </div>
      <pre className="code-surface max-h-72 overflow-auto whitespace-pre-wrap break-all rounded-lg px-3 py-2 font-mono text-xs text-text-primary" data-testid="ch-preview">{preview}</pre>
      <p className="text-xs text-text-muted">{isRu ? "Один и тот же seed всегда даёт ту же историю, поэтому её можно воспроизвести в баг-репорте." : "The same seed always gives the same history, so it can be reproduced in a bug report."}</p>
    </div>
  );
}
