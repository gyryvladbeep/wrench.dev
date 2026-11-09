"use client";
import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { SAMPLE_GROUPING, groupMessages } from "@/lib/messenger/grouping";
import { parseEvents } from "@/lib/messenger/sequence";
import { ZONES } from "@/lib/messenger/timestamps";
import { Field, NumberField, Panel, Stat, areaClass, inputClass } from "./messenger/ui";

export function MessageGroupingCalculatorTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [text, setText] = useState(SAMPLE_GROUPING);
  const [windowMin, setWindowMin] = useState("5");
  const [zone, setZone] = useState("UTC");
  const [lastRead, setLastRead] = useState("4");
  const parsed = useMemo(() => parseEvents(text), [text]);
  const report = useMemo(() => (parsed.error ? null : groupMessages(parsed.events, { windowMinutes: Math.max(0, Number(windowMin) || 0), zone, lastReadSeq: lastRead.trim() === "" ? null : Number(lastRead) })), [parsed, windowMin, zone, lastRead]);

  return (
    <div className="space-y-5 max-w-4xl">
      <Panel cols="sm:grid-cols-3">
        <NumberField id="mg-window" label={isRu ? "Окно группировки, минут" : "Group window, minutes"} value={windowMin} onChange={setWindowMin} min={0} />
        <Field id="mg-zone" label={isRu ? "Часовой пояс" : "Time zone"}>
          <select id="mg-zone" value={zone} onChange={(e) => setZone(e.target.value)} className={inputClass}>{ZONES.map((z) => <option key={z} value={z}>{z}</option>)}</select>
        </Field>
        <NumberField id="mg-lastread" label={isRu ? "Последнее прочитанное (номер, необязательно)" : "Last read message number (optional)"} value={lastRead} onChange={setLastRead} min={0} />
      </Panel>
      <Field id="mg-events" label={isRu ? "Сообщения: JSON-массив или NDJSON" : "Messages: JSON array or NDJSON"} hint={isRu ? "Поля: ts, user (строка или объект с id и name), seq. Подойдёт вывод «Генератора истории чата»." : "Fields: ts, user (a string or an object with id and name), seq. The output of the Chat History Generator works."}>
        <textarea id="mg-events" value={text} onChange={(e) => setText(e.target.value)} className={`${areaClass} min-h-[180px]`} spellCheck={false} />
      </Field>
      {parsed.error ? <p className="text-sm text-red-300" data-testid="mg-error">{parsed.error}</p> : report ? (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat id="mg-messages" label={isRu ? "Сообщений" : "Messages"} value={report.messages} />
            <Stat id="mg-groups" label={isRu ? "Групп (аватаров)" : "Groups (avatars)"} value={report.groups} />
            <Stat id="mg-days" label={isRu ? "Разделителей дней" : "Day dividers"} value={report.days} />
            <Stat id="mg-skipped" label={isRu ? "Пропущено" : "Skipped"} value={report.skipped} />
          </div>
          <ol className="space-y-1 text-sm" data-testid="mg-blocks">
            {report.blocks.map((b, i) => (
              <li key={i} data-kind={b.kind} data-label={b.label} data-count={b.count ?? ""} className={b.kind === "group" ? "rounded-lg border border-border px-3 py-1.5" : "px-3 py-1 text-center text-xs uppercase tracking-wider text-text-muted"}>
                {b.kind === "day" ? `--- ${b.label} ---` : b.kind === "unread" ? `=== ${isRu ? "Новые сообщения" : "New messages"} ===` : `${b.label}: ${b.count} ${isRu ? "сообщ." : "msg"}, ${new Date(b.firstTs ?? 0).toISOString().slice(11, 16)}-${new Date(b.lastTs ?? 0).toISOString().slice(11, 16)} UTC`}
              </li>
            ))}
          </ol>
        </>
      ) : null}
    </div>
  );
}
