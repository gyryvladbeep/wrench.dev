"use client";
import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { TimerMode, parseTimes, simulate } from "@/lib/messenger/timers";
import { Field, NumberField, Panel, Stat, areaClass, inputClass } from "./messenger/ui";

export function DebounceThrottleSimulatorTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [events, setEvents] = useState("0, 80, 160, 240, 900, 950, 1800");
  const [mode, setMode] = useState<TimerMode>("debounce");
  const [wait, setWait] = useState("300");
  const [leading, setLeading] = useState(false);
  const [trailing, setTrailing] = useState(true);

  const times = useMemo(() => parseTimes(events), [events]);
  const fires = useMemo(() => simulate({ events: times, mode, waitMs: Number(wait) || 0, leading, trailing }), [times, mode, wait, leading, trailing]);
  const end = Math.max(1, ...times, ...fires.map((f) => f.atMs));

  return (
    <div className="space-y-5 max-w-4xl">
      <Field id="td-events" label={isRu ? "Моменты событий, мс" : "Event times, ms"} hint={isRu ? "Например, нажатия клавиш в поле ввода. Через запятую, пробел или с новой строки." : "For example keystrokes in the input. Separated by commas, spaces or new lines."}>
        <textarea id="td-events" value={events} onChange={(e) => setEvents(e.target.value)} className={areaClass} spellCheck={false} />
      </Field>
      <Panel cols="sm:grid-cols-4 items-end">
        <Field id="td-mode" label={isRu ? "Режим" : "Mode"}>
          <select id="td-mode" value={mode} onChange={(e) => setMode(e.target.value as TimerMode)} className={inputClass}>
            <option value="debounce">debounce</option>
            <option value="throttle">throttle</option>
          </select>
        </Field>
        <NumberField id="td-wait" label={isRu ? "Ожидание, мс" : "Wait, ms"} value={wait} onChange={setWait} min={0} />
        <label className="flex items-center gap-2 text-sm text-text-secondary"><input type="checkbox" checked={leading} onChange={(e) => setLeading(e.target.checked)} /> leading</label>
        <label className="flex items-center gap-2 text-sm text-text-secondary"><input type="checkbox" checked={trailing} onChange={(e) => setTrailing(e.target.checked)} /> trailing</label>
      </Panel>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat id="td-events-count" label={isRu ? "Событий" : "Events"} value={times.length} />
        <Stat id="td-fires-count" label={isRu ? "Вызовов" : "Calls"} value={fires.length} />
        <Stat id="td-saved" label={isRu ? "Подавлено" : "Suppressed"} value={Math.max(0, times.length - fires.length)} />
      </div>
      <div className="code-surface relative h-16 rounded-lg" data-testid="td-timeline" aria-hidden>
        {times.map((t, i) => <span key={`e${i}`} className="absolute top-2 h-5 w-px bg-text-muted" style={{ left: `${(t / end) * 98 + 1}%` }} />)}
        {fires.map((f, i) => <span key={`f${i}`} className="absolute bottom-2 h-5 w-1 rounded bg-accent" style={{ left: `${(f.atMs / end) * 98 + 1}%` }} />)}
      </div>
      <ul className="space-y-1 text-sm" data-testid="td-fires">
        {fires.length === 0 ? <li className="text-text-muted">{isRu ? "Вызовов нет." : "No calls."}</li> : fires.map((f, i) => (
          <li key={i} data-at={f.atMs} data-edge={f.edge} className="font-mono">
            {f.atMs} ms - {f.edge} ({isRu ? "данные события" : "event data from"} {f.forEventMs} ms)
          </li>
        ))}
      </ul>
    </div>
  );
}
