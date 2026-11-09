"use client";
import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { AUTOLINK_SAMPLES, FLAG_LABELS, findLinks } from "@/lib/messenger/autolink";
import { btnActiveClass, btnClass, Field, areaClass } from "./messenger/ui";

export function UrlAutolinkEdgeCasesTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [text, setText] = useState(AUTOLINK_SAMPLES[0].text);
  const [sample, setSample] = useState(AUTOLINK_SAMPLES[0].id);
  const links = useMemo(() => findLinks(text), [text]);
  const cur = AUTOLINK_SAMPLES.find((s) => s.id === sample);

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex flex-wrap gap-2" data-testid="al-samples">
        {AUTOLINK_SAMPLES.map((s) => (
          <button key={s.id} type="button" data-testid={`al-sample-${s.id}`} onClick={() => { setSample(s.id); setText(s.text); }} className={sample === s.id ? btnActiveClass : btnClass}>
            {isRu ? s.noteRu : s.noteEn}
          </button>
        ))}
      </div>
      <Field id="al-text" label={isRu ? "Текст сообщения" : "Message text"}>
        <textarea id="al-text" value={text} onChange={(e) => { setText(e.target.value); setSample(""); }} className={areaClass} spellCheck={false} />
      </Field>
      {cur ? <p className="text-sm text-text-muted">{isRu ? cur.noteRu : cur.noteEn}</p> : null}
      <p className="text-sm text-text-muted" data-testid="al-count">{isRu ? "Найдено ссылок" : "Links found"}: {links.length}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="al-results">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-text-muted">
              <th className="px-3 py-2 font-medium">{isRu ? "Ссылка" : "Link"}</th>
              <th className="px-3 py-2 font-medium">{isRu ? "Тип" : "Kind"}</th>
              <th className="px-3 py-2 font-medium">href</th>
              <th className="px-3 py-2 font-medium">{isRu ? "Хост" : "Host"}</th>
              <th className="px-3 py-2 font-medium">{isRu ? "Что проверить" : "What to check"}</th>
            </tr>
          </thead>
          <tbody>
            {links.map((l, i) => (
              <tr key={i} data-kind={l.kind} data-flags={l.flags.join(",")} className="border-t border-border align-top">
                <td className="px-3 py-1.5 font-mono break-all">{l.text}</td>
                <td className="px-3 py-1.5">{l.kind}</td>
                <td className="px-3 py-1.5 font-mono break-all text-text-muted">{l.href}</td>
                <td className="px-3 py-1.5 font-mono">{l.host}</td>
                <td className="px-3 py-1.5 text-text-muted">{l.flags.map((f) => (isRu ? FLAG_LABELS[f]?.ru : FLAG_LABELS[f]?.en) ?? f).join("; ") || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-text-muted">{isRu ? "Это эталонная модель типичного автолинковщика: сравните её с тем, что ваш мессенджер показывает ссылкой, а что оставляет текстом." : "This is a reference model of a typical linkifier: compare it with what your messenger turns into a link and what it leaves as text."}</p>
    </div>
  );
}
