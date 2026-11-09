"use client";
import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { ZONES, dayLabel, dstTransitions, edgeCaseInstants, formatLocal, formatRelative, offsetMinutes, parseInstant } from "@/lib/messenger/timestamps";
import { btnClass, Field, Panel, inputClass } from "./messenger/ui";

const fmtOffset = (min: number) => `UTC${min < 0 ? "-" : "+"}${String(Math.floor(Math.abs(min) / 60)).padStart(2, "0")}:${String(Math.abs(min) % 60).padStart(2, "0")}`;

export function ChatTimestampEdgeCasesTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [msg, setMsg] = useState("2026-11-01T06:30:00Z");
  const [now, setNow] = useState("2026-11-02T12:00:00Z");
  const [zone, setZone] = useState("America/New_York");
  const [year, setYear] = useState("2026");

  const msgMs = parseInstant(msg);
  const nowMs = parseInstant(now);
  const valid = msgMs !== null && nowMs !== null;
  const edges = useMemo(() => {
    try { return edgeCaseInstants(zone, Number(year) || 2026); } catch { return []; }
  }, [zone, year]);
  const trCount = useMemo(() => { try { return dstTransitions(zone, Number(year) || 2026).length; } catch { return 0; } }, [zone, year]);

  return (
    <div className="space-y-5 max-w-4xl">
      <Panel cols="sm:grid-cols-2">
        <Field id="ct-msg" label={isRu ? "Время сообщения" : "Message time"} hint={isRu ? "ISO 8601, секунды или миллисекунды Unix. Без зоны время считается UTC." : "ISO 8601, Unix seconds or milliseconds. Without a zone the time is read as UTC."}>
          <input id="ct-msg" value={msg} onChange={(e) => setMsg(e.target.value)} className={inputClass} />
        </Field>
        <Field id="ct-now" label={isRu ? "Текущее время зрителя" : "Viewer's current time"}>
          <input id="ct-now" value={now} onChange={(e) => setNow(e.target.value)} className={inputClass} />
        </Field>
      </Panel>
      {!valid ? (
        <p className="text-sm text-text-muted" data-testid="ct-invalid">{isRu ? "Не удалось разобрать время." : "Could not parse the time."}</p>
      ) : (
        <>
          <p className="text-sm text-text-muted" data-testid="ct-relative">{isRu ? "Относительно" : "Relative"}: {formatRelative(nowMs, msgMs, isRu ? "ru" : "en")}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="ct-table">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-text-muted">
                  <th className="px-3 py-2 font-medium">{isRu ? "Зона" : "Zone"}</th>
                  <th className="px-3 py-2 font-medium">{isRu ? "Смещение" : "Offset"}</th>
                  <th className="px-3 py-2 font-medium">{isRu ? "Местное время" : "Local time"}</th>
                  <th className="px-3 py-2 font-medium">{isRu ? "Разделитель дня" : "Day divider"}</th>
                </tr>
              </thead>
              <tbody>
                {ZONES.map((z) => {
                  const d = dayLabel(z, nowMs, msgMs);
                  return (
                    <tr key={z} data-zone={z} data-day={d.label} data-days-ago={d.daysAgo} className="border-t border-border">
                      <td className="px-3 py-1.5 font-mono">{z}</td>
                      <td className="px-3 py-1.5 font-mono">{fmtOffset(offsetMinutes(z, msgMs))}</td>
                      <td className="px-3 py-1.5 font-mono">{formatLocal(z, msgMs)}</td>
                      <td className="px-3 py-1.5">{d.label}{d.label !== "today" && d.label !== "future" ? ` (${d.daysAgo})` : ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
      <Panel cols="sm:grid-cols-2">
        <Field id="ct-zone" label={isRu ? "Зона для крайних случаев" : "Zone for edge cases"}>
          <select id="ct-zone" value={zone} onChange={(e) => setZone(e.target.value)} className={inputClass}>
            {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        </Field>
        <Field id="ct-year" label={isRu ? "Год" : "Year"}>
          <input id="ct-year" type="number" value={year} onChange={(e) => setYear(e.target.value)} className={inputClass} />
        </Field>
      </Panel>
      <p className="text-sm text-text-muted" data-testid="ct-transitions">{isRu ? "Переходов на летнее время" : "DST transitions"}: {trCount}</p>
      <ul className="grid gap-2 sm:grid-cols-2" data-testid="ct-edges">
        {edges.map((e, i) => (
          <li key={i} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
            <span><span className="text-text-muted">{e.name}</span> <span className="font-mono">{new Date(e.epochMs).toISOString()}</span></span>
            <button type="button" className={btnClass} onClick={() => setMsg(new Date(e.epochMs).toISOString())}>{isRu ? "Подставить" : "Use"}</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
