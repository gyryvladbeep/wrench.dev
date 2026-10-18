import { Finding, finding, sortFindings } from "./findings";

export type StringsFormat = "android" | "ios";

export interface StringEntry {
  key: string;
  value: string;
  /** plurals и массивы сравниваются только по наличию ключа. */
  complex: boolean;
  translatable: boolean;
}

export interface ParsedStrings {
  entries: StringEntry[];
  duplicates: string[];
}

export function detectFormat(text: string): StringsFormat {
  return /<resources[\s>]|<string[\s>]/.test(text) ? "android" : "ios";
}

function unescapeXml(v: string): string {
  return v
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&")
    .replace(/\\n/g, "\n").replace(/\\'/g, "'").replace(/\\"/g, '"');
}

export function parseAndroid(text: string): ParsedStrings {
  const src = text.replace(/<!--[\s\S]*?-->/g, "");
  const entries: StringEntry[] = [];
  const seen = new Set<string>();
  const duplicates: string[] = [];
  const push = (e: StringEntry) => {
    if (seen.has(e.key)) duplicates.push(e.key);
    else { seen.add(e.key); entries.push(e); }
  };
  for (const m of src.matchAll(/<string\s+([^>]*?)>([\s\S]*?)<\/string>/g)) {
    const name = /name\s*=\s*["']([^"']+)["']/.exec(m[1])?.[1];
    if (!name) continue;
    const translatable = !/translatable\s*=\s*["']false["']/.test(m[1]);
    const raw = m[2].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
    push({ key: name, value: raw, complex: false, translatable });
  }
  for (const m of src.matchAll(/<(plurals|string-array)\s+([^>]*?)>([\s\S]*?)<\/\1>/g)) {
    const name = /name\s*=\s*["']([^"']+)["']/.exec(m[2])?.[1];
    if (!name) continue;
    const translatable = !/translatable\s*=\s*["']false["']/.test(m[2]);
    const items = Array.from(m[3].matchAll(/<item[^>]*>([\s\S]*?)<\/item>/g)).map((i) => i[1]);
    push({ key: name, value: items.join(" | "), complex: true, translatable });
  }
  return { entries, duplicates };
}

export function parseIos(text: string): ParsedStrings {
  const src = text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const entries: StringEntry[] = [];
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const m of src.matchAll(/"((?:[^"\\]|\\.)*)"\s*=\s*"((?:[^"\\]|\\.)*)"\s*;/g)) {
    const key = m[1];
    if (seen.has(key)) { duplicates.push(key); continue; }
    seen.add(key);
    entries.push({ key, value: m[2].replace(/\\"/g, '"').replace(/\\n/g, "\n"), complex: false, translatable: true });
  }
  return { entries, duplicates };
}

export function parseStrings(text: string, format: StringsFormat): ParsedStrings {
  return format === "android" ? parseAndroid(text) : parseIos(text);
}

const PLACEHOLDER_RE = /%(?:\d+\$)?[-+ 0#]*\d*(?:\.\d+)?[sdifgGeEcxXo@]|\{\{[^}]*\}\}|\{[^}\s]*\}/g;

/** Типы подстановок без позиций: "%1$s" и "%s" дают "%s", "{name}" остаётся как есть. */
export function placeholders(value: string): string[] {
  return (value.match(PLACEHOLDER_RE) ?? []).map((p) => (p.startsWith("%") ? "%" + p.slice(-1) : p)).sort();
}

function sameMultiset(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

function hasBadApostrophe(value: string): boolean {
  // В Android-ресурсах апостроф должен быть экранирован, если строка не взята в двойные кавычки.
  const v = value.trim();
  if (v.startsWith('"') && v.endsWith('"')) return false;
  return /(^|[^\\])'/.test(v);
}

export interface DiffResult {
  missing: string[];
  extra: string[];
  untranslated: string[];
  empty: string[];
  placeholderMismatch: { key: string; source: string[]; target: string[] }[];
  sourceCount: number;
  targetCount: number;
  findings: Finding[];
}

export function diffStrings(sourceText: string, targetText: string, format: StringsFormat): DiffResult {
  const src = parseStrings(sourceText, format);
  const dst = parseStrings(targetText, format);
  const srcMap = new Map(src.entries.filter((e) => e.translatable).map((e) => [e.key, e]));
  const dstMap = new Map(dst.entries.map((e) => [e.key, e]));

  const missing: string[] = [];
  const untranslated: string[] = [];
  const empty: string[] = [];
  const mismatch: DiffResult["placeholderMismatch"] = [];
  for (const [key, s] of srcMap) {
    const t = dstMap.get(key);
    if (!t) { missing.push(key); continue; }
    if (t.value.trim() === "" && s.value.trim() !== "") { empty.push(key); continue; }
    if (!s.complex && !t.complex) {
      if (s.value.trim() === t.value.trim() && /[A-Za-zА-Яа-я]{3,}/.test(s.value)) untranslated.push(key);
    }
    const ps = placeholders(s.value);
    const pt = placeholders(t.value);
    if (!s.complex && !sameMultiset(ps, pt)) mismatch.push({ key, source: ps, target: pt });
  }
  const extra = Array.from(dstMap.keys()).filter((k) => !srcMap.has(k) && !src.entries.some((e) => e.key === k));

  const findings: Finding[] = [];
  if (missing.length) findings.push(finding("error", "missing", `${missing.length} key${missing.length === 1 ? "" : "s"} missing in the translation: users will see the fallback language or the raw key.`, `В переводе не хватает ключей: ${missing.length}. Пользователи увидят язык по умолчанию или сам ключ.`));
  if (mismatch.length) findings.push(finding("error", "placeholders", `${mismatch.length} string${mismatch.length === 1 ? "" : "s"} with different placeholders: the app can crash or show wrong text.`, `Строк с разными подстановками: ${mismatch.length}. Приложение может упасть или показать неверный текст.`));
  if (empty.length) findings.push(finding("warning", "empty", `${empty.length} empty translation${empty.length === 1 ? "" : "s"}.`, `Пустых переводов: ${empty.length}.`));
  if (untranslated.length) findings.push(finding("warning", "untranslated", `${untranslated.length} string${untranslated.length === 1 ? "" : "s"} identical to the source: likely not translated.`, `Строк, совпадающих с оригиналом: ${untranslated.length}. Скорее всего, не переведены.`));
  if (extra.length) findings.push(finding("info", "extra", `${extra.length} key${extra.length === 1 ? "" : "s"} exist only in the translation (stale or renamed).`, `Ключей только в переводе: ${extra.length} (устарели или переименованы).`));
  for (const [label, labelRu, d] of [["source", "оригинале", src.duplicates], ["translation", "переводе", dst.duplicates]] as const) {
    if (d.length) findings.push(finding("warning", "duplicates", `Duplicate keys in the ${label}: ${Array.from(new Set(d)).join(", ")}.`, `Повторяющиеся ключи в ${labelRu}: ${Array.from(new Set(d)).join(", ")}.`));
  }
  if (format === "android") {
    const bad = dst.entries.filter((e) => !e.complex && hasBadApostrophe(e.value)).map((e) => e.key);
    if (bad.length) findings.push(finding("error", "apostrophe", `Unescaped apostrophe in: ${bad.join(", ")}. Android resource compilation fails; use \\' or wrap the text in double quotes.`, `Неэкранированный апостроф в: ${bad.join(", ")}. Компиляция ресурсов Android упадёт; используйте \\' или возьмите текст в двойные кавычки.`));
    const implied = dst.entries.filter((e) => !e.complex && /%[-+ 0#]*\d*(?:\.\d+)?[sdif]/.test(e.value) && (e.value.match(/%(?!\d+\$)[-+ 0#]*\d*(?:\.\d+)?[sdif]/g) ?? []).length >= 2).map((e) => e.key);
    if (implied.length) findings.push(finding("warning", "multi-subst", `Several non-positional placeholders in: ${implied.join(", ")}. Use %1$s, %2$s so translators can reorder them.`, `Несколько непозиционных подстановок в: ${implied.join(", ")}. Используйте %1$s, %2$s, чтобы переводчик мог менять порядок.`));
  }
  if (!missing.length && !mismatch.length && !empty.length && !untranslated.length && !extra.length && findings.length === 0) {
    findings.push(finding("info", "ok", "No differences found.", "Различий не найдено."));
  }
  return { missing, extra, untranslated, empty, placeholderMismatch: mismatch, sourceCount: src.entries.length, targetCount: dst.entries.length, findings: sortFindings(findings) };
}

export const SAMPLE_ANDROID_SOURCE = `<resources>
    <string name="app_name">Shop</string>
    <string name="welcome">Welcome, %1$s!</string>
    <string name="items_in_cart">%d items in your cart</string>
    <string name="checkout">Checkout</string>
    <string name="cancel">Cancel</string>
</resources>`;

export const SAMPLE_ANDROID_TARGET = `<resources>
    <string name="app_name">Shop</string>
    <string name="welcome">Добро пожаловать!</string>
    <string name="items_in_cart">Товаров в корзине: %s</string>
    <string name="cancel">Отмена</string>
    <string name="old_banner">Скидки</string>
</resources>`;
