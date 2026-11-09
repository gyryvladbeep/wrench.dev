"use client";
import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { parseEvents } from "@/lib/messenger/sequence";
import { DEFAULT_SEND_OPTIONS, SAMPLE_SEND, TRANSITIONS, STATUSES, validateSendStatuses } from "@/lib/messenger/send-status";
import { FindingsList } from "./mobile/FindingsList";
import { Field, NumberField, Panel, Stat, areaClass, inputClass } from "./messenger/ui";

export function MessageSendStatusValidatorTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [text, setText] = useState(SAMPLE_SEND);
  const [o, setO] = useState({ ...DEFAULT_SEND_OPTIONS });
  const parsed = useMemo(() => parseEvents(text), [text]);
  const report = useMemo(() => (parsed.error ? null : validateSendStatuses(parsed.events, o)), [parsed, o]);
  const key = (id: string, label: string, k: "idKey" | "statusKey" | "tsKey") => (
    <Field id={id} label={label}><input id={id} value={o[k]} onChange={(e) => setO({ ...o, [k]: e.target.value })} className={inputClass} /></Field>
  );

  return (
    <div className="space-y-5 max-w-4xl">
      <Panel cols="sm:grid-cols-4">
        {key("ss-id", isRu ? "Поле ID" : "ID key", "idKey")}
        {key("ss-status", isRu ? "Поле статуса" : "Status key", "statusKey")}
        {key("ss-ts", isRu ? "Поле времени" : "Time key", "tsKey")}
        <NumberField id="ss-stuck" label={isRu ? "Зависание после, мс" : "Stuck after, ms"} value={String(o.stuckMs)} onChange={(v) => setO({ ...o, stuckMs: Number(v) || 0 })} min={0} />
      </Panel>
      <Field id="ss-events" label={isRu ? "События статусов: JSON-массив или NDJSON" : "Status events: JSON array or NDJSON"}>
        <textarea id="ss-events" value={text} onChange={(e) => setText(e.target.value)} className={`${areaClass} min-h-[200px]`} spellCheck={false} />
      </Field>
      {parsed.error ? <p className="text-sm text-red-300" data-testid="ss-error">{parsed.error}</p> : report ? (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Stat id="ss-count" label={isRu ? "Сообщений" : "Messages"} value={report.messages.length} />
            <Stat id="ss-issues" label={isRu ? "Проблем" : "Issues"} value={report.findings.filter((f) => f.code !== "ok").length} />
          </div>
          <FindingsList findings={report.findings} isRu={isRu} testId="ss-findings" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="ss-messages">
              <thead><tr className="text-left text-[11px] uppercase tracking-wider text-text-muted"><th className="px-3 py-2 font-medium">ID</th><th className="px-3 py-2 font-medium">{isRu ? "Цепочка" : "Path"}</th><th className="px-3 py-2 font-medium">{isRu ? "Итог" : "Final"}</th></tr></thead>
              <tbody>
                {report.messages.map((m) => (
                  <tr key={m.id} data-id={m.id} data-final={m.final} className="border-t border-border">
                    <td className="px-3 py-1.5 font-mono">{m.id}</td><td className="px-3 py-1.5 font-mono">{m.path.join(" > ")}</td><td className="px-3 py-1.5">{m.final}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
      <details className="rounded-lg border border-border bg-surface p-3">
        <summary className="cursor-pointer text-sm text-text-secondary">{isRu ? "Допустимые переходы" : "Allowed transitions"}</summary>
        <ul className="mt-2 space-y-1 text-sm font-mono" data-testid="ss-transitions">{STATUSES.map((s) => <li key={s}>{s} {"->"} {TRANSITIONS[s].join(", ") || (isRu ? "(конец)" : "(end)")}</li>)}</ul>
      </details>
    </div>
  );
}
