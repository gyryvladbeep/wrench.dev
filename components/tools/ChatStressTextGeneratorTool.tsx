"use client";
import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { CopyButton } from "@/components/CopyButton";
import { STRESS_PRESETS, StressPresetId, clampParam, generateStress } from "@/lib/messenger/stress-text";
import { measure } from "@/lib/messenger/text-metrics";
import { Field, Stat, Panel, inputClass, areaClass } from "./messenger/ui";

export function ChatStressTextGeneratorTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [id, setId] = useState<StressPresetId>("ruler");
  const [param, setParam] = useState("4000");
  const preset = STRESS_PRESETS.find((p) => p.id === id)!;
  const n = clampParam(preset, Number(param));
  const text = useMemo(() => generateStress(id, n), [id, n]);
  const m = useMemo(() => measure(text), [text]);

  return (
    <div className="space-y-5 max-w-4xl">
      <Panel cols="sm:grid-cols-2">
        <Field id="cs-preset" label={isRu ? "Набор" : "Preset"}>
          <select id="cs-preset" className={inputClass} value={id} onChange={(e) => {
            const next = STRESS_PRESETS.find((p) => p.id === e.target.value)!;
            setId(next.id);
            if (next.param) setParam(String(next.param.default));
          }}>
            {STRESS_PRESETS.map((p) => <option key={p.id} value={p.id}>{isRu ? p.ru : p.en}</option>)}
          </select>
        </Field>
        {preset.param ? (
          <Field id="cs-param" label={isRu ? preset.param.ru : preset.param.en} hint={`${isRu ? "Максимум" : "Maximum"}: ${preset.param.max}`}>
            <input id="cs-param" type="number" min={1} max={preset.param.max} value={param} onChange={(e) => setParam(e.target.value)} className={inputClass} />
          </Field>
        ) : null}
      </Panel>
      <p className="text-sm text-text-muted" data-testid="cs-note">{isRu ? preset.noteRu : preset.noteEn}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Stat id="cs-utf16" label="UTF-16" value={m.utf16} />
        <Stat id="cs-codepoints" label={isRu ? "Кодпоинты" : "Code points"} value={m.codePoints} />
        <Stat id="cs-graphemes" label={isRu ? "Графемы" : "Graphemes"} value={m.graphemes} />
        <Stat id="cs-utf8" label="UTF-8, B" value={m.utf8} />
        <Stat id="cs-lines" label={isRu ? "Строки" : "Lines"} value={m.lines} />
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="cs-output" className="input-label !mb-0">{isRu ? "Текст для вставки в чат" : "Text to paste into the chat"}</label>
          <CopyButton value={text} />
        </div>
        <textarea id="cs-output" data-testid="cs-output" readOnly value={text} className={`${areaClass} min-h-[220px]`} />
      </div>
    </div>
  );
}
