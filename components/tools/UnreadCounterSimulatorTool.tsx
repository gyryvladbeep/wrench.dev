"use client";
import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { parseEvents } from "@/lib/messenger/sequence";
import { DEFAULT_UNREAD_OPTIONS, SAMPLE_UNREAD, simulateUnread } from "@/lib/messenger/unread";
import { Field, NumberField, Panel, Stat, areaClass } from "./messenger/ui";

export function UnreadCounterSimulatorTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [text, setText] = useState(SAMPLE_UNREAD);
  const [muted, setMuted] = useState(DEFAULT_UNREAD_OPTIONS.mutedCount);
  const [cap, setCap] = useState(String(DEFAULT_UNREAD_OPTIONS.cap));
  const parsed = useMemo(() => parseEvents(text), [text]);
  const result = useMemo(() => (parsed.error ? null : simulateUnread(parsed.events, { mutedCount: muted, cap: Math.max(1, Math.floor(Number(cap)) || 99) })), [parsed, muted, cap]);
  const last = result?.steps[result.steps.length - 1];

  return (
    <div className="space-y-5 max-w-4xl">
      <Field id="uc-events" label={isRu ? "События: JSON-массив или NDJSON" : "Events: JSON array or NDJSON"} hint={isRu ? 't: "msg", "read", "delete", "mute" или "unmute"; ch - канал; n - номер сообщения; mention и self - необязательные флаги.' : 't is "msg", "read", "delete", "mute" or "unmute"; ch is the channel; n is the message number; mention and self are optional flags.'}>
        <textarea id="uc-events" value={text} onChange={(e) => setText(e.target.value)} className={`${areaClass} min-h-[200px]`} spellCheck={false} />
      </Field>
      <Panel cols="sm:grid-cols-2 items-end">
        <label className="flex items-center gap-2 text-sm text-text-secondary"><input id="uc-muted" type="checkbox" checked={muted} onChange={(e) => setMuted(e.target.checked)} /> {isRu ? "Заглушённые каналы входят в общий бейдж" : "Muted channels count toward the total badge"}</label>
        <NumberField id="uc-cap" label={isRu ? "Предел бейджа" : "Badge cap"} value={cap} onChange={setCap} min={1} />
      </Panel>
      {parsed.error ? <p className="text-sm text-red-300" data-testid="uc-error">{parsed.error}</p> : result ? (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Stat id="uc-total" label={isRu ? "Итого непрочитанных" : "Total unread"} value={last ? last.total : 0} />
            <Stat id="uc-badge" label={isRu ? "Текст бейджа" : "Badge text"} value={last && last.badge ? last.badge : "-"} />
            <Stat id="uc-mentions" label={isRu ? "Упоминаний" : "Mentions"} value={last ? last.mentions : 0} />
          </div>
          <div className="overflow-x-auto">
            <h3 className="mb-2 text-sm font-medium text-text-primary">{isRu ? "Каналы в конце" : "Channels at the end"}</h3>
            <table className="w-full text-sm" data-testid="uc-channels">
              <thead><tr className="text-left text-[11px] uppercase tracking-wider text-text-muted">
                <th className="px-3 py-2 font-medium">{isRu ? "Канал" : "Channel"}</th><th className="px-3 py-2 font-medium">{isRu ? "Непрочитано" : "Unread"}</th>
                <th className="px-3 py-2 font-medium">{isRu ? "Упоминания" : "Mentions"}</th><th className="px-3 py-2 font-medium">{isRu ? "Заглушён" : "Muted"}</th>
              </tr></thead>
              <tbody>
                {result.channels.map((c) => (
                  <tr key={c.channel} data-channel={c.channel} data-unread={c.unread} data-mentions={c.mentions} data-muted={c.muted} className="border-t border-border">
                    <td className="px-3 py-1.5 font-mono">{c.channel}</td><td className="px-3 py-1.5">{c.unread}</td><td className="px-3 py-1.5">{c.mentions}</td><td className="px-3 py-1.5">{c.muted ? (isRu ? "да" : "yes") : (isRu ? "нет" : "no")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="overflow-x-auto">
            <h3 className="mb-2 text-sm font-medium text-text-primary">{isRu ? "Ожидаемый бейдж после каждого события" : "Expected badge after each event"}</h3>
            <table className="w-full text-sm" data-testid="uc-steps">
              <thead><tr className="text-left text-[11px] uppercase tracking-wider text-text-muted">
                <th className="px-3 py-2 font-medium">#</th><th className="px-3 py-2 font-medium">{isRu ? "Событие" : "Event"}</th><th className="px-3 py-2 font-medium">{isRu ? "Всего" : "Total"}</th><th className="px-3 py-2 font-medium">{isRu ? "Бейдж" : "Badge"}</th>
              </tr></thead>
              <tbody>
                {result.steps.map((s) => (
                  <tr key={s.index} data-total={s.total} data-badge={s.badge} className="border-t border-border">
                    <td className="px-3 py-1.5 text-text-muted">{s.index}</td><td className="px-3 py-1.5">{s.description}</td><td className="px-3 py-1.5 font-mono">{s.total}</td><td className="px-3 py-1.5 font-mono">{s.badge || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result.notes.length > 0 ? (
            <ul className="space-y-1 text-sm text-amber-300" data-testid="uc-notes">{result.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
