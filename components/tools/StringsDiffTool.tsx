"use client";
import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { SAMPLE_ANDROID_SOURCE, SAMPLE_ANDROID_TARGET, detectFormat, diffStrings } from "@/lib/mobile/strings-diff";
import { FindingsList } from "./mobile/FindingsList";

const areaClass = "code-surface w-full rounded-lg px-3 py-2.5 font-mono text-xs text-text-primary outline-none";

export function StringsDiffTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [source, setSource] = useState(SAMPLE_ANDROID_SOURCE);
  const [target, setTarget] = useState(SAMPLE_ANDROID_TARGET);

  const format = useMemo(() => detectFormat(source), [source]);
  const diff = useMemo(() => diffStrings(source, target, format), [source, target, format]);

  const group = (id: string, title: string, keys: string[]) =>
    keys.length === 0 ? null : (
      <section key={id} className="space-y-1" data-testid={`strings-${id}`}>
        <h3 className="text-sm font-semibold text-text-primary">{title} ({keys.length})</h3>
        <ul className="flex flex-wrap gap-2">
          {keys.map((k) => <li key={k} className="rounded border border-border bg-surface px-2 py-1 font-mono text-xs text-text-primary">{k}</li>)}
        </ul>
      </section>
    );

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="strings-source" className="input-label">{isRu ? "Оригинал (например, английский)" : "Source (for example, English)"}</label>
          <textarea id="strings-source" value={source} onChange={(e) => setSource(e.target.value)} rows={11} spellCheck={false} className={areaClass} />
        </div>
        <div>
          <label htmlFor="strings-target" className="input-label">{isRu ? "Перевод" : "Translation"}</label>
          <textarea id="strings-target" value={target} onChange={(e) => setTarget(e.target.value)} rows={11} spellCheck={false} className={areaClass} />
        </div>
      </div>

      <p className="text-sm text-text-muted" data-testid="strings-format">
        {isRu ? "Формат: " : "Format: "}{format === "android" ? "Android strings.xml" : "iOS Localizable.strings"}
        {" · "}{isRu ? "строк в оригинале" : "source strings"}: {diff.sourceCount}{" · "}{isRu ? "в переводе" : "in translation"}: {diff.targetCount}
      </p>

      <FindingsList findings={diff.findings} isRu={isRu} testId="strings-findings" />

      {group("missing", isRu ? "Нет в переводе" : "Missing in translation", diff.missing)}
      {group("placeholders", isRu ? "Разные подстановки" : "Placeholder mismatch", diff.placeholderMismatch.map((m) => `${m.key}: ${m.source.join(" ") || "-"} → ${m.target.join(" ") || "-"}`))}
      {group("untranslated", isRu ? "Совпадают с оригиналом" : "Identical to source", diff.untranslated)}
      {group("empty", isRu ? "Пустые переводы" : "Empty translations", diff.empty)}
      {group("extra", isRu ? "Только в переводе" : "Only in translation", diff.extra)}
    </div>
  );
}
