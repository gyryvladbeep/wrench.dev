"use client";
import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { CopyButton } from "@/components/CopyButton";
import { DEFAULT_WS_MOCK, SAMPLE_WS_FRAMES, generateWsMock, parseFrames } from "@/lib/messenger/ws-mock";
import { Field, NumberField, Panel, areaClass, inputClass } from "./messenger/ui";

export function PlaywrightWebsocketMockGeneratorTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [pattern, setPattern] = useState(DEFAULT_WS_MOCK.pattern);
  const [mode, setMode] = useState<"mock" | "proxy">("mock");
  const [frames, setFrames] = useState(SAMPLE_WS_FRAMES);
  const [closeAfter, setCloseAfter] = useState("0");
  const [code, setCode] = useState("1001");
  const [reason, setReason] = useState(DEFAULT_WS_MOCK.closeReason);

  const parsed = useMemo(() => parseFrames(frames), [frames]);
  const output = useMemo(() => generateWsMock({ pattern, mode, frames: parsed.frames, closeAfterMs: Math.max(0, Number(closeAfter) || 0), closeCode: Number(code) || 1001, closeReason: reason }), [pattern, mode, parsed, closeAfter, code, reason]);

  return (
    <div className="space-y-5 max-w-4xl">
      <Panel cols="sm:grid-cols-2">
        <Field id="pw-pattern" label={isRu ? "Шаблон адреса WebSocket" : "WebSocket URL pattern"} hint={isRu ? 'Glob вроде **/socket.io/** или регулярное выражение в слэшах: /\\/ws$/' : 'A glob such as **/socket.io/** or a regular expression in slashes: /\\/ws$/'}>
          <input id="pw-pattern" value={pattern} onChange={(e) => setPattern(e.target.value)} className={inputClass} />
        </Field>
        <Field id="pw-mode" label={isRu ? "Режим" : "Mode"}>
          <select id="pw-mode" value={mode} onChange={(e) => setMode(e.target.value as "mock" | "proxy")} className={inputClass}>
            <option value="mock">{isRu ? "Полная подмена (без настоящего сервера)" : "Full mock (no real server)"}</option>
            <option value="proxy">{isRu ? "Прокси: настоящий сервер плюс свои кадры" : "Proxy: real server plus your frames"}</option>
          </select>
        </Field>
        <NumberField id="pw-close" label={isRu ? "Закрыть соединение через, мс (0 - не закрывать)" : "Close the connection after, ms (0 = keep open)"} value={closeAfter} onChange={setCloseAfter} min={0} />
        <NumberField id="pw-code" label={isRu ? "Код закрытия" : "Close code"} value={code} onChange={setCode} min={1000} max={4999} />
        <Field id="pw-reason" label={isRu ? "Причина закрытия" : "Close reason"}>
          <input id="pw-reason" value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass} />
        </Field>
      </Panel>
      <Field id="pw-frames" label={isRu ? "Кадры от сервера: задержка_мс | кадр" : "Server frames: delay_ms | frame"} hint={isRu ? "Задержка отсчитывается от предыдущего кадра. Кадры можно взять из «Расшифровки realtime-кадров»." : "The delay counts from the previous frame. Frames can come from the Realtime Frame Decoder."}>
        <textarea id="pw-frames" value={frames} onChange={(e) => setFrames(e.target.value)} className={`${areaClass} min-h-[150px]`} spellCheck={false} />
      </Field>
      {parsed.errors.length > 0 ? <ul className="text-sm text-amber-300" data-testid="pw-errors">{parsed.errors.map((e, i) => <li key={i}>{e}</li>)}</ul> : null}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium text-text-primary">{isRu ? "Готовый тест Playwright" : "Ready Playwright test"}</h3>
          <CopyButton value={output} />
        </div>
        <pre className="code-surface max-h-[420px] overflow-auto whitespace-pre rounded-lg px-3 py-2 font-mono text-xs text-text-primary" data-testid="pw-output">{output}</pre>
      </div>
      <p className="text-xs text-text-muted">{isRu ? "Нужен Playwright 1.48 или новее (page.routeWebSocket). Подмена ставится до page.goto(), иначе страница успеет подключиться к настоящему серверу." : "Needs Playwright 1.48 or newer (page.routeWebSocket). The route must be set before page.goto(), or the page connects to the real server first."}</p>
    </div>
  );
}
