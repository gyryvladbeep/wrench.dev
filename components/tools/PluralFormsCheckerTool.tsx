"use client";
import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { DEFAULT_TEMPLATES, PLURAL_LOCALES, categories, parseNumbers, parseTemplates, previewNumbers, rangesOf } from "@/lib/messenger/plurals";
import { Field, Panel, areaClass, inputClass } from "./messenger/ui";

export function PluralFormsCheckerTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [locale, setLocale] = useState<string>("ru");
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES.ru);
  const [numbers, setNumbers] = useState("0, 1, 2, 3, 4, 5, 11, 12, 21, 22, 25, 100, 101, 111");

  const cats = useMemo(() => categories(locale), [locale]);
  const tpl = useMemo(() => parseTemplates(templates), [templates]);
  const rows = useMemo(() => previewNumbers(locale, tpl, parseNumbers(numbers)), [locale, tpl, numbers]);
  const ranges = useMemo(() => rangesOf(locale, 120), [locale]);
  const missing = cats.filter((c) => tpl[c] === undefined);

  return (
    <div className="space-y-5 max-w-4xl">
      <Panel cols="sm:grid-cols-2">
        <Field id="pf-locale" label={isRu ? "Язык" : "Language"}>
          <select id="pf-locale" value={locale} onChange={(e) => { setLocale(e.target.value); setTemplates(DEFAULT_TEMPLATES[e.target.value] ?? ""); }} className={inputClass}>
            {PLURAL_LOCALES.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </Field>
        <Field id="pf-numbers" label={isRu ? "Числа для проверки" : "Numbers to preview"}>
          <input id="pf-numbers" value={numbers} onChange={(e) => setNumbers(e.target.value)} className={inputClass} />
        </Field>
      </Panel>
      <p className="text-sm text-text-muted" data-testid="pf-categories">{isRu ? "Категории языка" : "Language categories"}: <span className="font-mono">{cats.join(", ")}</span></p>
      <Field id="pf-templates" label={isRu ? "Шаблоны: категория: текст с {n}" : "Templates: category: text with {n}"}>
        <textarea id="pf-templates" value={templates} onChange={(e) => setTemplates(e.target.value)} className={areaClass} spellCheck={false} />
      </Field>
      {missing.length > 0 ? <p className="text-sm text-red-300" data-testid="pf-missing">{isRu ? "Нет шаблонов для категорий" : "No templates for the categories"}: {missing.join(", ")}</p> : null}
      <div className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="pf-preview">
          <thead><tr className="text-left text-[11px] uppercase tracking-wider text-text-muted"><th className="px-3 py-2 font-medium">n</th><th className="px-3 py-2 font-medium">{isRu ? "Категория" : "Category"}</th><th className="px-3 py-2 font-medium">{isRu ? "Результат" : "Result"}</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} data-n={r.n} data-category={r.category} data-missing={r.text === null} className="border-t border-border">
                <td className="px-3 py-1.5 font-mono">{r.n}</td><td className="px-3 py-1.5">{r.category}</td><td className="px-3 py-1.5">{r.text ?? (isRu ? "(нет шаблона)" : "(no template)")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section>
        <h3 className="mb-2 text-sm font-medium text-text-primary">{isRu ? "Какие числа какой категории (0-120)" : "Which numbers fall in which category (0-120)"}</h3>
        <ul className="grid gap-1 text-sm font-mono sm:grid-cols-2" data-testid="pf-ranges">
          {ranges.map((r, i) => <li key={i} data-category={r.category} data-from={r.from} data-to={r.to}>{r.from === r.to ? r.from : `${r.from}-${r.to}`}: {r.category}</li>)}
        </ul>
      </section>
    </div>
  );
}
