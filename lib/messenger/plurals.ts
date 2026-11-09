export const PLURAL_LOCALES = ["en", "ru", "uk", "pl", "de", "fr", "es", "ar", "he", "cs", "ja"] as const;
export type PluralCategory = "zero" | "one" | "two" | "few" | "many" | "other";

export function categories(locale: string): PluralCategory[] {
  return new Intl.PluralRules(locale).resolvedOptions().pluralCategories as PluralCategory[];
}

export function categoryOf(locale: string, n: number): PluralCategory {
  return new Intl.PluralRules(locale).select(n) as PluralCategory;
}

export interface Range {
  from: number;
  to: number;
  category: PluralCategory;
}

/** Диапазоны целых чисел одной категории от 0 до max. */
export function rangesOf(locale: string, max: number): Range[] {
  const out: Range[] = [];
  for (let n = 0; n <= max; n++) {
    const c = categoryOf(locale, n);
    const last = out[out.length - 1];
    if (last && last.category === c && last.to === n - 1) last.to = n;
    else out.push({ from: n, to: n, category: c });
  }
  return out;
}

export function parseTemplates(text: string): Partial<Record<PluralCategory, string>> {
  const out: Partial<Record<PluralCategory, string>> = {};
  for (const line of text.split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx < 1) continue;
    const k = line.slice(0, idx).trim() as PluralCategory;
    if (["zero", "one", "two", "few", "many", "other"].includes(k)) out[k] = line.slice(idx + 1).trim();
  }
  return out;
}

export interface PreviewRow {
  n: number;
  category: PluralCategory;
  text: string | null;
}

export function previewNumbers(locale: string, templates: Partial<Record<PluralCategory, string>>, numbers: number[]): PreviewRow[] {
  return numbers.map((n) => {
    const category = categoryOf(locale, n);
    const tpl = templates[category];
    return { n, category, text: tpl === undefined ? null : tpl.replace(/\{n\}/g, String(n)) };
  });
}

export function parseNumbers(text: string): number[] {
  return text.split(/[\s,;]+/).filter(Boolean).map(Number).filter((n) => Number.isFinite(n) && n >= 0).slice(0, 200);
}

export const DEFAULT_TEMPLATES: Record<string, string> = {
  en: "one: {n} unread message\nother: {n} unread messages",
  ru: "one: {n} непрочитанное сообщение\nfew: {n} непрочитанных сообщения\nmany: {n} непрочитанных сообщений\nother: {n} непрочитанного сообщения",
  uk: "one: {n} непрочитане повідомлення\nfew: {n} непрочитані повідомлення\nmany: {n} непрочитаних повідомлень\nother: {n} непрочитаного повідомлення",
  pl: "one: {n} nieprzeczytana wiadomość\nfew: {n} nieprzeczytane wiadomości\nmany: {n} nieprzeczytanych wiadomości\nother: {n} nieprzeczytanej wiadomości",
  de: "one: {n} ungelesene Nachricht\nother: {n} ungelesene Nachrichten",
  fr: "one: {n} message non lu\nmany: {n} de messages non lus\nother: {n} messages non lus",
  es: "one: {n} mensaje sin leer\nmany: {n} de mensajes sin leer\nother: {n} mensajes sin leer",
  ar: "zero: {n} لا رسائل\none: {n} رسالة\ntwo: {n} رسالتان\nfew: {n} رسائل\nmany: {n} رسالة\nother: {n} رسالة",
  he: "one: {n} הודעה שלא נקראה\ntwo: {n} הודעות שלא נקראו\nother: {n} הודעות שלא נקראו",
  cs: "one: {n} nepřečtená zpráva\nfew: {n} nepřečtené zprávy\nmany: {n} nepřečtené zprávy\nother: {n} nepřečtených zpráv",
  ja: "other: 未読メッセージ {n} 件",
};
