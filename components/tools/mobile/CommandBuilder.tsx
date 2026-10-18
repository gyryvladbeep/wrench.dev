"use client";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { CommandDef, FieldDef, Values, defaultsFor } from "@/lib/mobile/command-types";

interface Props {
  isRu: boolean;
  commands: CommandDef[];
  globalFields: FieldDef[];
  /** Префикс для id полей и data-testid, например "adb". */
  idPrefix: string;
}

const inputClass = "code-surface w-full rounded-lg px-3 py-2.5 font-mono text-sm text-text-primary outline-none";

/**
 * Общий движок для конструкторов команд (ADB, simctl): выбор команды,
 * поля с условиями показа и готовый вывод с кнопкой копирования.
 */
export function CommandBuilder({ isRu, commands, globalFields, idPrefix }: Props) {
  const [commandId, setCommandId] = useState(commands[0].id);
  const [globals, setGlobals] = useState<Values>(() => defaultsFor(globalFields));
  const [stored, setStored] = useState<Record<string, Values>>({});

  const command = commands.find((c) => c.id === commandId) ?? commands[0];
  const values: Values = useMemo(
    () => ({ ...defaultsFor(command.fields), ...(stored[command.id] ?? {}) }),
    [command, stored],
  );

  const lines = useMemo(() => command.build(values, globals), [command, values, globals]);
  const output = lines.join("\n");

  const groups = useMemo(() => {
    const map = new Map<string, { label: string; items: CommandDef[] }>();
    for (const c of commands) {
      const label = isRu ? c.groupRu : c.group;
      if (!map.has(c.group)) map.set(c.group, { label, items: [] });
      map.get(c.group)!.items.push(c);
    }
    return Array.from(map.values());
  }, [commands, isRu]);

  const setValue = (key: string, value: string | boolean) =>
    setStored((s) => ({ ...s, [command.id]: { ...values, ...(s[command.id] ?? {}), [key]: value } }));

  const renderField = (f: FieldDef, value: string | boolean, onChange: (v: string | boolean) => void, scope: string) => {
    const id = `${idPrefix}-${scope}-${f.key}`;
    const label = isRu ? f.labelRu : f.label;
    if (f.type === "check") {
      return (
        <label key={f.key} htmlFor={id} className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
          <input id={id} type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--accent-rgb))]" />
          {label}
        </label>
      );
    }
    return (
      <div key={f.key}>
        <label htmlFor={id} className="input-label">{label}</label>
        {f.type === "select" ? (
          <select id={id} value={String(value)} onChange={(e) => onChange(e.target.value)} className={inputClass}>
            {f.options?.map((o) => (
              <option key={o.value} value={o.value}>{isRu && o.labelRu ? o.labelRu : o.label}</option>
            ))}
          </select>
        ) : (
          <input id={id} type="text" value={String(value)} placeholder={f.placeholder} spellCheck={false}
            onChange={(e) => onChange(e.target.value)} className={inputClass} />
        )}
      </div>
    );
  };

  const visibleFields = command.fields.filter((f) => !f.when || f.when(values));
  const note = isRu ? command.noteRu : command.note;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="grid gap-3 sm:grid-cols-2">
        {globalFields.map((f) =>
          renderField(f, globals[f.key], (v) => setGlobals((g) => ({ ...g, [f.key]: v })), "global"),
        )}
        <div>
          <label htmlFor={`${idPrefix}-command`} className="input-label">{isRu ? "Команда" : "Command"}</label>
          <select id={`${idPrefix}-command`} value={command.id} onChange={(e) => setCommandId(e.target.value)} className={inputClass}>
            {groups.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.items.map((c) => (
                  <option key={c.id} value={c.id}>{isRu ? c.labelRu : c.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {note && <p className="text-xs text-text-muted leading-relaxed">{note}</p>}

      {visibleFields.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 rounded-lg border border-border bg-surface p-4">
          {visibleFields.map((f) => renderField(f, values[f.key], (v) => setValue(f.key, v), "field"))}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="input-label !mb-0">{isRu ? "Готовая команда" : "Ready command"}</span>
          <CopyButton value={output} label={isRu ? "Копировать всё" : "Copy all"} />
        </div>
        <pre data-testid={`${idPrefix}-output`} className="code-surface overflow-x-auto rounded-lg px-4 py-3 text-sm leading-relaxed text-text-primary whitespace-pre">{output}</pre>
      </div>
    </div>
  );
}
