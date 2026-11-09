"use client";
import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { SAMPLE_SHORTCUTS, checkShortcuts, parseShortcuts } from "@/lib/messenger/shortcuts";
import { FindingsList } from "./mobile/FindingsList";
import { Field, Stat, areaClass } from "./messenger/ui";

export function ShortcutConflictCheckerTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [text, setText] = useState(SAMPLE_SHORTCUTS);
  const parsed = useMemo(() => parseShortcuts(text), [text]);
  const findings = useMemo(() => checkShortcuts(parsed.list), [parsed]);

  return (
    <div className="space-y-5 max-w-4xl">
      <Field id="sk-input" label={isRu ? "Горячие клавиши приложения" : "App shortcuts"} hint={isRu ? "Строки вида Ctrl+K: Быстрый переход. Cmd, Command и Meta считаются одним модификатором." : "Lines like Ctrl+K: Quick switcher. Cmd, Command and Meta are treated as one modifier."}>
        <textarea id="sk-input" value={text} onChange={(e) => setText(e.target.value)} className={`${areaClass} min-h-[180px]`} spellCheck={false} />
      </Field>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat id="sk-count" label={isRu ? "Сочетаний" : "Shortcuts"} value={parsed.list.length} />
        <Stat id="sk-issues" label={isRu ? "Замечаний" : "Findings"} value={findings.filter((f) => f.code !== "ok").length} />
      </div>
      {parsed.errors.length > 0 ? <ul className="text-sm text-amber-300" data-testid="sk-errors">{parsed.errors.map((e, i) => <li key={i}>{e}</li>)}</ul> : null}
      <FindingsList findings={findings} isRu={isRu} testId="sk-findings" />
      <p className="text-xs text-text-muted">{isRu ? "Список конфликтов основан на типичных сочетаниях Chrome, Firefox, Windows и macOS и не заменяет проверку в нужных вам браузерах. Раскладки и расширения браузера могут добавлять свои." : "The conflict list is based on typical Chrome, Firefox, Windows and macOS shortcuts and does not replace a check in the browsers you support. Keyboard layouts and browser extensions can add their own."}</p>
    </div>
  );
}
