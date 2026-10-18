"use client";
import { Finding } from "@/lib/mobile/findings";

const STYLE: Record<Finding["level"], string> = {
  error: "border-red-500/30 bg-red-500/5 text-red-300",
  warning: "border-amber-500/30 bg-amber-500/5 text-amber-300",
  info: "border-border bg-surface text-text-muted",
};

const LABEL: Record<Finding["level"], { en: string; ru: string }> = {
  error: { en: "Error", ru: "Ошибка" },
  warning: { en: "Warning", ru: "Предупреждение" },
  info: { en: "Note", ru: "Заметка" },
};

/** Список результатов проверки: уровень, текст, стабильный data-code для тестов. */
export function FindingsList({ findings, isRu, testId, emptyText }: { findings: Finding[]; isRu: boolean; testId: string; emptyText?: string }) {
  if (findings.length === 0) {
    return emptyText ? <p className="text-sm text-text-muted" data-testid={testId}>{emptyText}</p> : null;
  }
  return (
    <ul className="space-y-2" data-testid={testId}>
      {findings.map((f, i) => (
        <li key={`${f.code}-${i}`} data-code={f.code} data-level={f.level} className={`rounded-lg border px-3 py-2 text-sm ${STYLE[f.level]}`}>
          <span className="mr-2 text-[11px] font-semibold uppercase tracking-wider">{isRu ? LABEL[f.level].ru : LABEL[f.level].en}</span>
          {isRu ? f.ru : f.en}
        </li>
      ))}
    </ul>
  );
}
