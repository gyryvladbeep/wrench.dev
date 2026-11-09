import { Finding, finding, sortFindings } from "../mobile/findings";

/** Разбивка на графемы (то, что пользователь видит как один символ). */
export function graphemes(text: string): string[] {
  const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: string }) => { segment: (s: string) => Iterable<{ segment: string }> } }).Segmenter;
  if (Seg) return Array.from(new Seg(undefined, { granularity: "grapheme" }).segment(text), (s) => s.segment);
  return Array.from(text);
}

export function utf8Bytes(text: string): number {
  return new TextEncoder().encode(text).length;
}

export interface TextMetrics {
  graphemes: number;
  codePoints: number;
  utf16: number;
  utf8: number;
  lines: number;
}

export function measure(text: string): TextMetrics {
  return {
    graphemes: graphemes(text).length,
    codePoints: Array.from(text).length,
    utf16: text.length,
    utf8: utf8Bytes(text),
    lines: text === "" ? 0 : text.split(/\r\n|\r|\n/).length,
  };
}

export type LimitUnit = "utf16" | "codePoints" | "graphemes" | "utf8";

export const LIMIT_UNITS: { id: LimitUnit; en: string; ru: string }[] = [
  { id: "utf16", en: "UTF-16 units (JavaScript length)", ru: "единицы UTF-16 (JavaScript length)" },
  { id: "codePoints", en: "Unicode code points", ru: "кодовые точки Unicode" },
  { id: "graphemes", en: "Graphemes (what the user sees)", ru: "графемы (то, что видит пользователь)" },
  { id: "utf8", en: "UTF-8 bytes", ru: "байты UTF-8" },
];

// ── Классификация символов ────────────────────────────────────────────────

export type CharClass = "letter" | "number" | "mark" | "symbol" | "punctuation" | "space" | "control" | "format" | "other";

export function classify(cp: string): CharClass {
  if (/^\p{L}$/u.test(cp)) return "letter";
  if (/^\p{N}$/u.test(cp)) return "number";
  if (/^\p{M}$/u.test(cp)) return "mark";
  if (/^\p{S}$/u.test(cp)) return "symbol";
  if (/^\p{P}$/u.test(cp)) return "punctuation";
  if (/^\p{Z}$/u.test(cp)) return "space";
  if (/^\p{Cc}$/u.test(cp)) return "control";
  if (/^\p{Cf}$/u.test(cp)) return "format";
  return "other";
}

const BIDI = new Set([0x202a, 0x202b, 0x202c, 0x202d, 0x202e, 0x2066, 0x2067, 0x2068, 0x2069, 0x200e, 0x200f, 0x061c]);

/** Невидимые или меняющие отображение символы, кроме обычного пробела и перевода строки. */
export function isInvisible(cp: string): boolean {
  const code = cp.codePointAt(0) ?? 0;
  if (cp === " " || cp === "\n" || cp === "\r" || cp === "\t") return false;
  return /^[\p{Cc}\p{Cf}]$/u.test(cp) || (/^\p{Zs}$/u.test(cp)) || (code >= 0xfe00 && code <= 0xfe0f);
}

export function isBidi(cp: string): boolean {
  return BIDI.has(cp.codePointAt(0) ?? 0);
}

export interface CodePointRow {
  char: string;
  hex: string;
  cls: CharClass;
  invisible: boolean;
}

export function codePointRows(text: string, max = 200): CodePointRow[] {
  const rows: CodePointRow[] = [];
  for (const ch of text) {
    if (rows.length >= max) break;
    const code = ch.codePointAt(0) ?? 0;
    rows.push({ char: ch, hex: "U+" + code.toString(16).toUpperCase().padStart(4, "0"), cls: classify(ch), invisible: isInvisible(ch) });
  }
  return rows;
}

const SCRIPTS: [string, RegExp][] = [
  ["Latin", /\p{Script=Latin}/u], ["Cyrillic", /\p{Script=Cyrillic}/u], ["Greek", /\p{Script=Greek}/u],
  ["Arabic", /\p{Script=Arabic}/u], ["Hebrew", /\p{Script=Hebrew}/u], ["Han", /\p{Script=Han}/u],
  ["Hiragana", /\p{Script=Hiragana}/u], ["Katakana", /\p{Script=Katakana}/u], ["Hangul", /\p{Script=Hangul}/u],
  ["Thai", /\p{Script=Thai}/u], ["Devanagari", /\p{Script=Devanagari}/u], ["Armenian", /\p{Script=Armenian}/u],
];

export function scriptsIn(text: string): string[] {
  return SCRIPTS.filter(([, re]) => re.test(text)).map(([name]) => name);
}

/** Слова, в которых смешаны латиница и кириллица: признак подмены похожих букв. */
export function mixedScriptWords(text: string): string[] {
  return (text.match(/[\p{L}\p{M}]+/gu) ?? []).filter((w) => /\p{Script=Latin}/u.test(w) && /\p{Script=Cyrillic}/u.test(w));
}

export interface Inspection {
  metrics: TextMetrics;
  scripts: string[];
  invisibleCount: number;
  bidiCount: number;
  nfcDiffers: boolean;
  nfkcDiffers: boolean;
  mixedWords: string[];
  findings: Finding[];
}

export function inspect(text: string): Inspection {
  const metrics = measure(text);
  const cps = Array.from(text);
  const invisibleCount = cps.filter(isInvisible).length;
  const bidiCount = cps.filter(isBidi).length;
  const nfcDiffers = text.normalize("NFC") !== text;
  const nfkcDiffers = text.normalize("NFKC") !== text;
  const mixedWords = mixedScriptWords(text);
  const findings: Finding[] = [];
  if (invisibleCount) findings.push(finding("warning", "invisible", `${invisibleCount} invisible or format character${invisibleCount === 1 ? "" : "s"} found (zero-width, control, special spaces, variation selectors). They count toward limits but do not show.`, `Найдено невидимых и форматирующих символов: ${invisibleCount} (нулевой ширины, управляющие, особые пробелы, вариационные селекторы). Они считаются в лимите, но не видны.`));
  if (bidiCount) findings.push(finding("warning", "bidi", `${bidiCount} bidirectional control character${bidiCount === 1 ? "" : "s"}: they can reorder how text is displayed and be used to disguise content.`, `Управляющих символов направления текста: ${bidiCount}. Они меняют порядок отображения и могут маскировать содержимое.`));
  if (mixedWords.length) findings.push(finding("warning", "mixed-script", `Words mixing Latin and Cyrillic letters: ${mixedWords.slice(0, 5).join(", ")}. Lookalike letters can make different names appear identical.`, `Слова с латиницей и кириллицей вместе: ${mixedWords.slice(0, 5).join(", ")}. Похожие буквы позволяют выдать разные имена за одинаковые.`));
  if (nfcDiffers) findings.push(finding("info", "not-nfc", "The text is not in NFC form: the same visible text can have a different length and fail exact-match search.", "Текст не в форме NFC: один и тот же видимый текст может иметь другую длину и не находиться точным поиском."));
  if (metrics.graphemes !== metrics.utf16) findings.push(finding("info", "length-differs", `The length depends on the unit: ${metrics.graphemes} graphemes, ${metrics.codePoints} code points, ${metrics.utf16} UTF-16 units, ${metrics.utf8} UTF-8 bytes.`, `Длина зависит от единицы измерения: графем ${metrics.graphemes}, кодовых точек ${metrics.codePoints}, единиц UTF-16 ${metrics.utf16}, байт UTF-8 ${metrics.utf8}.`));
  return { metrics, scripts: scriptsIn(text), invisibleCount, bidiCount, nfcDiffers, nfkcDiffers, mixedWords, findings: sortFindings(findings) };
}

export function limitReport(text: string, limit: number): { unit: LimitUnit; used: number; over: boolean }[] {
  const m = measure(text);
  return LIMIT_UNITS.map((u) => ({ unit: u.id, used: m[u.id], over: m[u.id] > limit }));
}
