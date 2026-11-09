"use client";
import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { CopyButton } from "@/components/CopyButton";
import { SAMPLE_EMOJI, analyzeEmoji } from "@/lib/messenger/emoji";
import { Field, Stat, areaClass } from "./messenger/ui";

export function EmojiSequenceAnalyzerTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [text, setText] = useState(SAMPLE_EMOJI);
  const r = useMemo(() => analyzeEmoji(text), [text]);

  return (
    <div className="space-y-5 max-w-4xl">
      <Field id="es-text" label={isRu ? "Текст сообщения" : "Message text"}>
        <textarea id="es-text" value={text} onChange={(e) => setText(e.target.value)} className={areaClass} spellCheck={false} />
      </Field>
      <div className="flex items-center gap-3"><CopyButton value={SAMPLE_EMOJI} label={isRu ? "Копировать образец" : "Copy the sample"} /></div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat id="es-emoji" label={isRu ? "Эмодзи-кластеров" : "Emoji clusters"} value={r.emojiCount} />
        <Stat id="es-other" label={isRu ? "Остальных символов" : "Other characters"} value={r.textCount} />
      </div>
      {r.rows.length === 0 ? <p className="text-sm text-text-muted" data-testid="es-none">{isRu ? "Эмодзи в тексте нет." : "No emoji in the text."}</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="es-rows">
            <thead><tr className="text-left text-[11px] uppercase tracking-wider text-text-muted">
              <th className="px-3 py-2 font-medium">{isRu ? "Кластер" : "Cluster"}</th><th className="px-3 py-2 font-medium">{isRu ? "Вид" : "Kind"}</th><th className="px-3 py-2 font-medium">{isRu ? "Кодпоинты" : "Code points"}</th><th className="px-3 py-2 font-medium">UTF-16</th><th className="px-3 py-2 font-medium">UTF-8 B</th>
            </tr></thead>
            <tbody>
              {r.rows.map((row, i) => (
                <tr key={i} data-kinds={row.kinds.join(",")} data-parts={row.parts} data-utf16={row.utf16} data-utf8={row.utf8} className="border-t border-border align-top">
                  <td className="px-3 py-1.5 text-lg">{row.cluster}</td><td className="px-3 py-1.5">{row.kinds.join(", ")}{row.parts > 1 ? ` (${row.parts})` : ""}</td>
                  <td className="px-3 py-1.5 font-mono text-xs">{row.codePoints.join(" ")}</td><td className="px-3 py-1.5 font-mono">{row.utf16}</td><td className="px-3 py-1.5 font-mono">{row.utf8}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {r.notes.length > 0 ? (
        <ul className="space-y-2" data-testid="es-notes">
          {r.notes.map((n) => <li key={n.code} data-code={n.code} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-muted">{isRu ? n.ru : n.en}</li>)}
        </ul>
      ) : null}
    </div>
  );
}
