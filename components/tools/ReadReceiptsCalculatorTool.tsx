"use client";
import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { SAMPLE_AUTHORS, SAMPLE_MEMBERS, computeReceipts, parseAuthors, parseMembers } from "@/lib/messenger/read-receipts";
import { Field, NumberField, Panel, areaClass } from "./messenger/ui";

export function ReadReceiptsCalculatorTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [members, setMembers] = useState(SAMPLE_MEMBERS);
  const [authors, setAuthors] = useState(SAMPLE_AUTHORS);
  const [total, setTotal] = useState("6");
  const [names, setNames] = useState("2");

  const report = useMemo(() => computeReceipts(parseMembers(members), parseAuthors(authors), Math.min(500, Number(total) || 0), Math.max(1, Math.floor(Number(names)) || 2)), [members, authors, total, names]);
  const rows = report.rows.filter((r) => r.author);

  return (
    <div className="space-y-5 max-w-4xl">
      <Panel cols="sm:grid-cols-2">
        <Field id="rr-members" label={isRu ? "Участники и указатели прочтения" : "Members and read pointers"} hint={isRu ? "Строки вида Имя: номер последнего прочитанного сообщения." : "Lines like Name: number of the last message read."}>
          <textarea id="rr-members" value={members} onChange={(e) => setMembers(e.target.value)} className={areaClass} spellCheck={false} />
        </Field>
        <Field id="rr-authors" label={isRu ? "Авторы по номеру сообщения (необязательно)" : "Authors by message number (optional)"} hint={isRu ? "Строки вида 3: Alice. Статус показывается только у сообщений с автором." : "Lines like 3: Alice. The status is shown only for messages with an author."}>
          <textarea id="rr-authors" value={authors} onChange={(e) => setAuthors(e.target.value)} className={areaClass} spellCheck={false} />
        </Field>
        <NumberField id="rr-total" label={isRu ? "Всего сообщений" : "Total messages"} value={total} onChange={setTotal} min={0} max={500} />
        <NumberField id="rr-names" label={isRu ? "Имён до «и ещё N»" : "Names shown before 'and N others'"} value={names} onChange={setNames} min={1} />
      </Panel>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="rr-rows">
          <thead><tr className="text-left text-[11px] uppercase tracking-wider text-text-muted">
            <th className="px-3 py-2 font-medium">#</th><th className="px-3 py-2 font-medium">{isRu ? "Автор" : "Author"}</th><th className="px-3 py-2 font-medium">{isRu ? "Ожидаемая подпись" : "Expected label"}</th><th className="px-3 py-2 font-medium">{isRu ? "Не прочитали" : "Not read by"}</th>
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.seq} data-seq={r.seq} data-label={r.label} data-read={r.readBy.length} className="border-t border-border">
                <td className="px-3 py-1.5 text-text-muted">{r.seq}</td><td className="px-3 py-1.5">{r.author}</td><td className="px-3 py-1.5 font-mono">{r.label}</td><td className="px-3 py-1.5 text-text-muted">{r.unreadBy.join(", ") || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="mt-2 text-sm text-text-muted" data-testid="rr-empty">{isRu ? "Нет сообщений с автором в пределах общего числа." : "No messages with an author within the total."}</p> : null}
      </div>
      {report.notes.length > 0 ? (
        <ul className="space-y-1 text-sm text-amber-300" data-testid="rr-notes">
          {report.notes.map((n, i) => <li key={i} data-code={n.code}>{isRu ? n.ru : n.en}</li>)}
        </ul>
      ) : null}
    </div>
  );
}
