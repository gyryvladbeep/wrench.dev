"use client";
import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { checkOrder, decodeId } from "@/lib/messenger/id-decoder";
import { Field, areaClass, btnClass } from "./messenger/ui";

const SAMPLE = ["1700000000.000100", "1700000060.000200", "1699999990.000300", "1700000120.000400", "not-an-id"].join("\n");
const ALL_TYPES = ["507f1f77bcf86cd799439011", "175928847299117063", "01ARZ3NDEKTSV4RRFFQ69G5FAV", "1700000000.000100", "1700000000123", "018c4c5a-3f10-7abc-8def-0123456789ab"].join("\n");

export function MessageIdDecoderTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [text, setText] = useState(SAMPLE);
  const lines = useMemo(() => text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean), [text]);
  const readings = useMemo(() => lines.map((l) => ({ id: l, list: decodeId(l) })), [lines]);
  const order = useMemo(() => checkOrder(lines), [lines]);
  const bad = order.filter((o) => o.status === "out-of-order").length;

  return (
    <div className="space-y-5 max-w-4xl">
      <Field id="mi-ids" label={isRu ? "ID сообщений, по одному в строке" : "Message IDs, one per line"}>
        <textarea id="mi-ids" value={text} onChange={(e) => setText(e.target.value)} className={`${areaClass} min-h-[160px]`} spellCheck={false} />
      </Field>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btnClass} data-testid="mi-sample-feed" onClick={() => setText(SAMPLE)}>{isRu ? "Лента с нарушением порядка" : "Feed with an ordering bug"}</button>
        <button type="button" className={btnClass} data-testid="mi-sample-types" onClick={() => setText(ALL_TYPES)}>{isRu ? "По одному ID каждого типа" : "One ID of every type"}</button>
      </div>
      <p className="text-sm text-text-muted" data-testid="mi-summary">
        {isRu ? "Строк" : "Lines"}: {lines.length} · {isRu ? "нарушений порядка" : "out of order"}: {bad}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="mi-table">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-text-muted">
              <th className="px-3 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">ID</th>
              <th className="px-3 py-2 font-medium">{isRu ? "Тип" : "Type"}</th>
              <th className="px-3 py-2 font-medium">{isRu ? "Время UTC" : "Time (UTC)"}</th>
              <th className="px-3 py-2 font-medium">{isRu ? "Порядок" : "Order"}</th>
            </tr>
          </thead>
          <tbody>
            {order.map((o, i) => {
              const alt = readings[i]?.list.length ?? 0;
              return (
                <tr key={i} data-status={o.status} className="border-t border-border align-top">
                  <td className="px-3 py-1.5 text-text-muted">{o.line}</td>
                  <td className="px-3 py-1.5 font-mono break-all">{o.id}</td>
                  <td className="px-3 py-1.5">{o.status === "undecoded" ? "-" : o.type}{alt > 1 ? ` (+${alt - 1})` : ""}</td>
                  <td className="px-3 py-1.5 font-mono">{o.epochMs === null ? "-" : new Date(o.epochMs).toISOString()}</td>
                  <td className="px-3 py-1.5">{o.status === "ok" ? "ok" : o.status === "out-of-order" ? (isRu ? "раньше предыдущего" : "earlier than previous") : (isRu ? "не распознан" : "not recognized")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <details className="rounded-lg border border-border bg-surface p-3">
        <summary className="cursor-pointer text-sm text-text-secondary">{isRu ? "Все варианты расшифровки" : "All possible readings"}</summary>
        <ul className="mt-2 space-y-2 text-sm" data-testid="mi-readings">
          {readings.map((r, i) => (
            <li key={i}><span className="font-mono break-all">{r.id}</span>
              {r.list.length === 0 ? <span className="ml-2 text-text-muted">-</span> : r.list.map((x, j) => (
                <div key={j} className="ml-4 text-text-muted">{x.type}: {new Date(x.epochMs).toISOString()} {x.detail ? `(${x.detail})` : ""}</div>
              ))}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
