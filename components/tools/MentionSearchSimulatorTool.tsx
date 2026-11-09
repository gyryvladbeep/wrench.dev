"use client";
import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { SAMPLE_PEOPLE, fixLayout, normalizeSearch, parsePeople, searchMentions } from "@/lib/messenger/mention-search";
import { Field, areaClass, inputClass } from "./messenger/ui";

export function MentionSearchSimulatorTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [people, setPeople] = useState(SAMPLE_PEOPLE);
  const [query, setQuery] = useState("фдшсу");
  const list = useMemo(() => parsePeople(people), [people]);
  const hits = useMemo(() => searchMentions(list, query), [list, query]);
  const reasons: Record<string, { en: string; ru: string }> = {
    exact: { en: "exact username", ru: "точный логин" }, "username-prefix": { en: "username starts with the query", ru: "логин начинается с запроса" },
    "name-prefix": { en: "a name word starts with the query", ru: "слово имени начинается с запроса" }, substring: { en: "contains the query", ru: "содержит запрос" },
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <Field id="ms-people" label={isRu ? "Люди: логин | имя, по одному в строке" : "People: username | name, one per line"}>
        <textarea id="ms-people" value={people} onChange={(e) => setPeople(e.target.value)} className={areaClass} spellCheck={false} />
      </Field>
      <Field id="ms-query" label={isRu ? "Запрос после @" : "Query after @"} hint={isRu ? "Попробуйте набрать имя в чужой раскладке: «фдшсу» вместо alice." : 'Try a name typed in the wrong layout: "фдшсу" instead of alice.'}>
        <input id="ms-query" value={query} onChange={(e) => setQuery(e.target.value)} className={inputClass} />
      </Field>
      <p className="text-sm text-text-muted" data-testid="ms-normalized">
        {isRu ? "Нормализовано" : "Normalized"}: <span className="font-mono">{normalizeSearch(query) || "-"}</span> · {isRu ? "в другой раскладке" : "in the other layout"}: <span className="font-mono">{fixLayout(query) || "-"}</span>
      </p>
      {hits.length === 0 ? <p className="text-sm text-text-muted" data-testid="ms-empty">{isRu ? "Никого не найдено." : "No one found."}</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="ms-results">
            <thead><tr className="text-left text-[11px] uppercase tracking-wider text-text-muted"><th className="px-3 py-2 font-medium">{isRu ? "Логин" : "Username"}</th><th className="px-3 py-2 font-medium">{isRu ? "Имя" : "Name"}</th><th className="px-3 py-2 font-medium">{isRu ? "Оценка" : "Score"}</th><th className="px-3 py-2 font-medium">{isRu ? "Почему" : "Why"}</th></tr></thead>
            <tbody>
              {hits.map((h) => (
                <tr key={h.person.username} data-username={h.person.username} data-via={h.via} data-reason={h.reason} data-score={h.score} className="border-t border-border">
                  <td className="px-3 py-1.5 font-mono">@{h.person.username}</td><td className="px-3 py-1.5">{h.person.name}</td><td className="px-3 py-1.5">{h.score}</td>
                  <td className="px-3 py-1.5 text-text-muted">{isRu ? reasons[h.reason].ru : reasons[h.reason].en}{h.via === "layout" ? (isRu ? "; после исправления раскладки" : "; after fixing the layout") : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-text-muted">{isRu ? "Это эталонная модель: регистр, диакритика, ё и разделители не учитываются, совпадение с начала логина важнее совпадения в середине. Сравните порядок со списком автодополнения вашего мессенджера." : "This is a reference model: case, diacritics, the letter yo and separators are ignored, and a match at the start of the username ranks above a match in the middle. Compare the order with your messenger's autocomplete list."}</p>
    </div>
  );
}
