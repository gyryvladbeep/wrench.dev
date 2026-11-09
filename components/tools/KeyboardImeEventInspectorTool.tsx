"use client";
import { useEffect, useRef, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { btnClass, Field, areaClass } from "./messenger/ui";

interface Entry {
  n: number;
  type: string;
  key: string;
  code: string;
  keyCode: string;
  composing: string;
  inputType: string;
  data: string;
}

const MAX = 200;

export function KeyboardImeEventInspectorTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [log, setLog] = useState<Entry[]>([]);
  const [warn, setWarn] = useState(false);
  const counter = useRef(0);
  const fieldRef = useRef<HTMLTextAreaElement>(null);

  const push = (e: Omit<Entry, "n">) => {
    counter.current += 1;
    const entry = { ...e, n: counter.current };
    setLog((prev) => [entry, ...prev].slice(0, MAX));
  };
  // React подменяет onBeforeInput своим событием, поэтому настоящий beforeinput слушаем напрямую.
  useEffect(() => {
    const el = fieldRef.current;
    if (!el) return;
    const handler = (e: Event) => {
      const ie = e as InputEvent;
      push({ type: "beforeinput", key: "", code: "", keyCode: "", composing: String(ie.isComposing), inputType: ie.inputType ?? "", data: ie.data ?? "" });
    };
    el.addEventListener("beforeinput", handler);
    return () => el.removeEventListener("beforeinput", handler);
  }, []);

  const key = (type: string) => (ev: React.KeyboardEvent) => {
    const ne = ev.nativeEvent;
    push({ type, key: ev.key, code: ev.code, keyCode: String(ev.keyCode), composing: String(ne.isComposing), inputType: "", data: "" });
    if (type === "keydown" && ev.key === "Enter" && (ne.isComposing || ev.keyCode === 229)) setWarn(true);
  };
  const comp = (type: string) => (ev: React.CompositionEvent) => push({ type, key: "", code: "", keyCode: "", composing: "", inputType: "", data: ev.data });
  const input = (type: string) => (ev: React.FormEvent) => {
    const ne = ev.nativeEvent as InputEvent;
    push({ type, key: "", code: "", keyCode: "", composing: String(ne.isComposing), inputType: ne.inputType ?? "", data: ne.data ?? "" });
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <Field id="ki-field" label={isRu ? "Поле для ввода" : "Typing field"} hint={isRu ? "Включите японскую, китайскую или корейскую раскладку и введите текст. Нажмите Enter, пока подчёркнут кандидат: сообщение не должно отправляться." : "Switch to a Japanese, Chinese or Korean input method and type. Press Enter while a candidate is underlined: the message must not be sent."}>
        <textarea id="ki-field" ref={fieldRef} className={areaClass}
          onKeyDown={key("keydown")} onKeyUp={key("keyup")}
          onInput={input("input")}
          onCompositionStart={comp("compositionstart")} onCompositionUpdate={comp("compositionupdate")} onCompositionEnd={comp("compositionend")} />
      </Field>
      {warn ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-300" data-testid="ki-warning">
          {isRu ? "Enter нажат во время композиции (isComposing = true или keyCode 229). Если сообщение отправилось, это баг: обработчик отправки должен игнорировать такой Enter." : "Enter was pressed during composition (isComposing is true or keyCode is 229). If the message was sent, that is a bug: the send handler must ignore this Enter."}
        </p>
      ) : null}
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted" data-testid="ki-count">{isRu ? "События" : "Events"}: {log.length}</p>
        <button type="button" className={btnClass} onClick={() => { setLog([]); setWarn(false); }}>{isRu ? "Очистить" : "Clear"}</button>
      </div>
      <div className="max-h-[420px] overflow-auto">
        <table className="w-full text-xs" data-testid="ki-log">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-text-muted">
              {["#", isRu ? "Событие" : "Event", "key", "code", "keyCode", "isComposing", "inputType", "data"].map((h) => <th key={h} className="px-2 py-1.5 font-medium">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {log.map((e) => (
              <tr key={e.n} data-type={e.type} data-key={e.key} className="border-t border-border font-mono">
                <td className="px-2 py-1">{e.n}</td><td className="px-2 py-1">{e.type}</td><td className="px-2 py-1">{e.key === " " ? "Space" : e.key}</td>
                <td className="px-2 py-1">{e.code}</td><td className="px-2 py-1">{e.keyCode}</td><td className="px-2 py-1">{e.composing}</td>
                <td className="px-2 py-1">{e.inputType}</td><td className="px-2 py-1">{e.data}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
