"use client";
import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { DEFAULT_CONFIG, SAMPLE_EVENTS, parseEvents, validateSequence } from "@/lib/messenger/sequence";
import { FindingsList } from "./mobile/FindingsList";
import { Field, Panel, Stat, areaClass, inputClass } from "./messenger/ui";

export function ChatEventSequenceValidatorTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [text, setText] = useState(SAMPLE_EVENTS);
  const [cfg, setCfg] = useState(DEFAULT_CONFIG);
  const parsed = useMemo(() => parseEvents(text), [text]);
  const report = useMemo(() => (parsed.error ? null : validateSequence(parsed.events, cfg)), [parsed, cfg]);
  const key = (id: string, label: string, k: keyof typeof cfg) => (
    <Field id={id} label={label}>
      <input id={id} value={cfg[k]} onChange={(e) => setCfg({ ...cfg, [k]: e.target.value })} className={inputClass} />
    </Field>
  );

  return (
    <div className="space-y-5 max-w-4xl">
      <Panel cols="sm:grid-cols-4">
        {key("sv-id", isRu ? "Поле ID" : "ID key", "idKey")}
        {key("sv-seq", isRu ? "Поле порядкового номера" : "Sequence key", "seqKey")}
        {key("sv-ts", isRu ? "Поле времени" : "Timestamp key", "tsKey")}
        {key("sv-group", isRu ? "Поле группы (канал)" : "Group key", "groupKey")}
      </Panel>
      <Field id="sv-input" label={isRu ? "События: JSON-массив или NDJSON" : "Events: JSON array or NDJSON"}>
        <textarea id="sv-input" value={text} onChange={(e) => setText(e.target.value)} className={`${areaClass} min-h-[200px]`} spellCheck={false} />
      </Field>
      {parsed.error ? (
        <p className="text-sm text-red-300" data-testid="sv-error">{parsed.error}</p>
      ) : report ? (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Stat id="sv-total" label={isRu ? "Событий" : "Events"} value={report.total} />
            <Stat id="sv-groups" label={isRu ? "Групп" : "Groups"} value={report.groups} />
            <Stat id="sv-issues" label={isRu ? "Проблем" : "Issues"} value={report.findings.filter((f) => f.code !== "ok").length} />
          </div>
          <FindingsList findings={report.findings} isRu={isRu} testId="sv-findings" />
        </>
      ) : null}
    </div>
  );
}
