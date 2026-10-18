export interface PseudoOptions {
  accents: boolean;
  /** Прирост длины в процентах (0 - без удлинения). */
  expansion: number;
  brackets: boolean;
  /** Оборачивает строку в RLO/PDF, чтобы проверить поведение при смене направления текста. */
  rtl: boolean;
}

const LOWER: Record<string, string> = {
  a: "á", b: "ƀ", c: "ç", d: "ð", e: "é", f: "ƒ", g: "ĝ", h: "ĥ", i: "í", j: "ĵ", k: "ķ", l: "ļ", m: "ɱ",
  n: "ñ", o: "ö", p: "þ", q: "ǫ", r: "ŕ", s: "š", t: "ţ", u: "ü", v: "ṽ", w: "ŵ", x: "ẋ", y: "ý", z: "ž",
};
const UPPER: Record<string, string> = Object.fromEntries(
  Object.entries({
    a: "Á", b: "Ɓ", c: "Ç", d: "Ð", e: "É", f: "Ƒ", g: "Ĝ", h: "Ĥ", i: "Í", j: "Ĵ", k: "Ķ", l: "Ļ", m: "Ṁ",
    n: "Ñ", o: "Ö", p: "Þ", q: "Ǫ", r: "Ŕ", s: "Š", t: "Ţ", u: "Ü", v: "Ṽ", w: "Ŵ", x: "Ẋ", y: "Ý", z: "Ž",
  }).map(([k, v]) => [k.toUpperCase(), v]),
);

/**
 * Участки, которые нельзя менять: printf-форматы (%s, %1$d, %@), именованные
 * подстановки ({name}, {{name}}, {0}), HTML-теги и сущности, экранированные переводы строк.
 */
const PROTECTED_RE = /%(?:\d+\$)?[-+ 0#]*\d*(?:\.\d+)?[sdifgGeEcxXo@%]|\{\{[^}]*\}\}|\{[^}]*\}|<[^>]+>|&[a-zA-Z]+;|&#\d+;|\\[nrt]/g;

export function accentify(text: string): string {
  let out = "";
  for (const ch of text) out += LOWER[ch] ?? UPPER[ch] ?? ch;
  return out;
}

export function pseudoLocalizeLine(line: string, opts: PseudoOptions): { text: string; placeholders: number } {
  // Пустые строки оставляем как есть: скобки и удлинение вокруг пустоты только мешают.
  if (line.trim() === "") return { text: line, placeholders: 0 };
  let placeholders = 0;
  let result = "";
  let last = 0;
  for (const m of line.matchAll(PROTECTED_RE)) {
    const idx = m.index ?? 0;
    result += opts.accents ? accentify(line.slice(last, idx)) : line.slice(last, idx);
    result += m[0];
    placeholders += 1;
    last = idx + m[0].length;
  }
  result += opts.accents ? accentify(line.slice(last)) : line.slice(last);

  if (opts.expansion > 0 && line.trim() !== "") {
    const extra = Math.ceil((line.length * opts.expansion) / 100);
    result += " " + "~".repeat(Math.max(1, extra - 1));
  }
  if (opts.brackets) result = `[${result}]`;
  if (opts.rtl) result = `‮${result}‬`;
  return { text: result, placeholders };
}

export interface PseudoRow {
  original: string;
  text: string;
  placeholders: number;
  growth: number;
}

export function pseudoLocalize(input: string, opts: PseudoOptions): PseudoRow[] {
  return input.split(/\r?\n/).map((original) => {
    const { text, placeholders } = pseudoLocalizeLine(original, opts);
    const growth = original.length === 0 ? 0 : Math.round(((text.length - original.length) / original.length) * 100);
    return { original, text, placeholders, growth };
  });
}
