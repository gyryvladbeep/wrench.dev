import { graphemes } from "./text-metrics";

export type EmojiKind = "flag" | "tag-flag" | "keycap" | "zwj" | "skin-tone" | "emoji-presentation" | "text-presentation" | "emoji" | "text";

export interface EmojiRow {
  cluster: string;
  kinds: EmojiKind[];
  codePoints: string[];
  utf16: number;
  utf8: number;
  /** Количество компонентов, склеенных ZWJ. */
  parts: number;
}

export interface EmojiReport {
  rows: EmojiRow[];
  emojiCount: number;
  textCount: number;
  notes: { code: string; en: string; ru: string }[];
}

const PICT = /\p{Extended_Pictographic}/u;
const REGIONAL = /[\u{1F1E6}-\u{1F1FF}]/gu;
const SKIN = /[\u{1F3FB}-\u{1F3FF}]/u;
const TAGS = /[\u{E0020}-\u{E007F}]/u;

function utf8(s: string): number {
  return new TextEncoder().encode(s).length;
}

export function classifyCluster(c: string): EmojiKind[] {
  const kinds: EmojiKind[] = [];
  const regional = c.match(REGIONAL)?.length ?? 0;
  if (regional >= 2) kinds.push("flag");
  if (TAGS.test(c)) kinds.push("tag-flag");
  if (/^[0-9#*]️?⃣$/u.test(c)) kinds.push("keycap");
  if (c.includes("‍")) kinds.push("zwj");
  if (SKIN.test(c)) kinds.push("skin-tone");
  if (c.includes("️") && !kinds.includes("keycap")) kinds.push("emoji-presentation");
  if (c.includes("︎")) kinds.push("text-presentation");
  const isEmoji = PICT.test(c) || regional >= 2 || kinds.includes("keycap");
  if (kinds.length === 0) kinds.push(isEmoji ? "emoji" : "text");
  return kinds;
}

export function analyzeEmoji(text: string): EmojiReport {
  const rows: EmojiRow[] = [];
  const notes: EmojiReport["notes"] = [];
  let emojiCount = 0, textCount = 0;
  for (const c of graphemes(text)) {
    const kinds = classifyCluster(c);
    const isText = kinds.length === 1 && kinds[0] === "text";
    if (isText) { textCount++; continue; }
    emojiCount++;
    const cps = Array.from(c);
    rows.push({
      cluster: c, kinds,
      codePoints: cps.map((p) => "U+" + (p.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, "0")),
      utf16: c.length, utf8: utf8(c),
      parts: c.split("‍").length,
    });
  }
  const has = (k: EmojiKind) => rows.some((r) => r.kinds.includes(k));
  if (has("flag")) notes.push({ code: "flag-windows", en: "Flag emoji are two regional indicator letters. Some systems, such as Windows desktop browsers, show them as letters like 'US' instead of a flag.", ru: "Флаги состоят из двух региональных индикаторов. В некоторых системах, например в браузерах на Windows, вместо флага показываются буквы вроде 'US'." });
  if (has("zwj")) notes.push({ code: "zwj-fallback", en: "ZWJ sequences fall back to separate emoji on systems that do not know the combination. Check the picture, the cursor step and the character counter.", ru: "Последовательности с ZWJ на системах, не знающих комбинацию, распадаются на отдельные эмодзи. Проверьте картинку, шаг курсора и счётчик символов." });
  if (has("text-presentation")) notes.push({ code: "vs15", en: "Variation selector 15 asks for the text style. The messenger should keep it and not turn it into a coloured emoji.", ru: "Селектор вариации 15 запрашивает текстовый вид. Мессенджер должен сохранить его, а не превращать в цветной эмодзи." });
  if (rows.some((r) => r.kinds.length === 1 && r.kinds[0] === "emoji" && /^[☀-➿←-⇿⬀-⯿]/u.test(r.cluster) && !r.cluster.includes("️"))) {
    notes.push({ code: "no-vs16", en: "Some symbols have no variation selector 16: they may render as black-and-white text on some systems.", ru: "У некоторых символов нет селектора вариации 16: в части систем они покажутся чёрно-белым текстом." });
  }
  if (has("tag-flag")) notes.push({ code: "tag-flag", en: "Subdivision flags (England, Scotland, Wales) use tag characters and are often unsupported or stripped by servers.", ru: "Флаги регионов (Англия, Шотландия, Уэльс) используют теговые символы, их часто не поддерживают или вырезает сервер." });
  return { rows, emojiCount, textCount, notes };
}

export const SAMPLE_EMOJI = "Hi \u{1F44B}\u{1F3FD} \u{1F468}‍\u{1F469}‍\u{1F467} \u{1F1FA}\u{1F1F8} 1️⃣ ❤️ ❤︎ ❤ \u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}";
