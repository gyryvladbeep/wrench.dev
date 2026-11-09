"use client";
import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { codePointRows, inspect, limitReport, LIMIT_UNITS } from "@/lib/messenger/text-metrics";
import { FindingsList } from "./mobile/FindingsList";
import { Field, NumberField, Stat, Panel, areaClass } from "./messenger/ui";

const SAMPLE = "Hello 👨‍👩‍👧 café​ пример";

export function UnicodeTextInspectorTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [text, setText] = useState(SAMPLE);
  const [limit, setLimit] = useState("20");
  const info = useMemo(() => inspect(text), [text]);
  const rows = useMemo(() => codePointRows(text, 200), [text]);
  const limits = useMemo(() => limitReport(text, Number(limit) || 0), [text, limit]);
  const m = info.metrics;

  return (
    <div className="space-y-5 max-w-4xl">
      <Field id="ui-text" label={isRu ? "Текст сообщения" : "Message text"}>
        <textarea id="ui-text" value={text} onChange={(e) => setText(e.target.value)} className={areaClass} spellCheck={false} />
      </Field>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Stat id="ui-graphemes" label={isRu ? "Графемы" : "Graphemes"} value={m.graphemes} />
        <Stat id="ui-codepoints" label={isRu ? "Кодпоинты" : "Code points"} value={m.codePoints} />
        <Stat id="ui-utf16" label="UTF-16" value={m.utf16} />
        <Stat id="ui-utf8" label="UTF-8, B" value={m.utf8} />
        <Stat id="ui-lines" label={isRu ? "Строки" : "Lines"} value={m.lines} />
      </div>
      <Panel cols="sm:grid-cols-[160px_1fr] items-start">
        <NumberField id="ui-limit" label={isRu ? "Лимит сообщения" : "Message limit"} value={limit} onChange={setLimit} min={0} />
        <ul className="grid gap-2 sm:grid-cols-2" data-testid="ui-limits">
          {limits.map((l) => {
            const meta = LIMIT_UNITS.find((u) => u.id === l.unit)!;
            return (
              <li key={l.unit} data-unit={l.unit} data-over={l.over} className={`rounded-lg border px-3 py-2 text-sm ${l.over ? "border-red-500/30 bg-red-500/5 text-red-300" : "border-border text-text-muted"}`}>
                {isRu ? meta.ru : meta.en}: <span className="font-mono">{l.used}</span> {l.over ? (isRu ? "- превышает" : "- over") : ""}
              </li>
            );
          })}
        </ul>
      </Panel>
      <FindingsList findings={info.findings} isRu={isRu} testId="ui-findings" emptyText={isRu ? "Скрытых символов, смешения алфавитов и расхождений нормализации нет." : "No hidden characters, mixed scripts or normalization differences."} />
      <div className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="ui-rows">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-text-muted">
              <th className="px-3 py-2 font-medium">{isRu ? "Символ" : "Char"}</th>
              <th className="px-3 py-2 font-medium">{isRu ? "Кодпоинт" : "Code point"}</th>
              <th className="px-3 py-2 font-medium">{isRu ? "Класс" : "Class"}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} data-hex={r.hex} data-invisible={r.invisible} className="border-t border-border">
                <td className="px-3 py-1.5 font-mono">{r.invisible ? "·" : r.char}</td>
                <td className="px-3 py-1.5 font-mono">{r.hex}</td>
                <td className="px-3 py-1.5 text-text-muted">{r.cls}{r.invisible ? (isRu ? " (невидимый)" : " (invisible)") : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {m.codePoints > 200 ? <p className="mt-2 text-xs text-text-muted">{isRu ? "Показаны первые 200 кодпоинтов." : "Showing the first 200 code points."}</p> : null}
      </div>
    </div>
  );
}
