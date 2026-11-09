export type StressPresetId =
  | "ruler" | "words" | "unbroken" | "lines" | "emoji" | "rtl" | "zalgo" | "invisible" | "scripts" | "special" | "whitespace";

export interface StressPreset {
  id: StressPresetId;
  en: string;
  ru: string;
  noteEn: string;
  noteRu: string;
  /** Подпись числового параметра или пусто, если параметра нет. */
  param?: { en: string; ru: string; default: number; max: number };
}

export const STRESS_PRESETS: StressPreset[] = [
  { id: "ruler", en: "Exact length with a ruler", ru: "Точная длина с линейкой", param: { en: "Length, UTF-16 units", ru: "Длина, единицы UTF-16", default: 4000, max: 200000 },
    noteEn: "Numbered tokens like [0001] show where a message was cut: the last visible token tells you how many characters arrived.", noteRu: "Пронумерованные токены вроде [0001] показывают, где сообщение обрезано: последний видимый токен говорит, сколько символов дошло." },
  { id: "words", en: "Many ordinary words", ru: "Много обычных слов", param: { en: "Words", ru: "Слов", default: 500, max: 20000 },
    noteEn: "Wrapped paragraph text for scrolling, truncation and read-more tests.", noteRu: "Обычный абзацный текст для проверки прокрутки, обрезания и кнопки «показать полностью»." },
  { id: "unbroken", en: "One unbroken string", ru: "Одна строка без пробелов", param: { en: "Characters", ru: "Символов", default: 300, max: 100000 },
    noteEn: "No spaces or break points: tests horizontal overflow and word-break rules.", noteRu: "Без пробелов и точек переноса: проверяет горизонтальное переполнение и правила переноса слов." },
  { id: "lines", en: "Many line breaks", ru: "Много переводов строк", param: { en: "Lines", ru: "Строк", default: 60, max: 5000 },
    noteEn: "Tall message: tests collapse height, composer growth and scroll anchoring.", noteRu: "Высокое сообщение: проверка свёртывания по высоте, роста поля ввода и привязки прокрутки." },
  { id: "emoji", en: "Emoji and sequences", ru: "Эмодзи и последовательности",
    noteEn: "Simple emoji, skin tones, ZWJ families, flags and keycaps: one visible symbol can be many code units.", noteRu: "Простые эмодзи, тона кожи, семьи через ZWJ, флаги и кейкапы: один видимый символ может состоять из многих единиц." },
  { id: "rtl", en: "Right-to-left mix", ru: "Смесь с письмом справа налево",
    noteEn: "Arabic and Hebrew mixed with English, digits and punctuation: tests alignment and bidi ordering.", noteRu: "Арабский и иврит вперемешку с английским, цифрами и знаками: проверка выравнивания и порядка отображения." },
  { id: "zalgo", en: "Stacked combining marks", ru: "Стопки комбинируемых знаков",
    noteEn: "Text with many combining marks that overflow line height into neighbouring messages.", noteRu: "Текст с множеством комбинируемых знаков, которые вылезают за высоту строки на соседние сообщения." },
  { id: "invisible", en: "Invisible characters", ru: "Невидимые символы",
    noteEn: "Zero-width space, joiners, soft hyphen, no-break space, BOM: a message that looks empty but is not.", noteRu: "Пробел нулевой ширины, соединители, мягкий перенос, неразрывный пробел, BOM: сообщение, которое выглядит пустым, но не пустое." },
  { id: "scripts", en: "Many scripts", ru: "Много письменностей",
    noteEn: "Chinese, Japanese, Korean, Thai, Devanagari, Armenian, Cyrillic and Greek: font fallback and line breaking.", noteRu: "Китайский, японский, корейский, тайский, деванагари, армянский, кириллица и греческий: запасные шрифты и переносы." },
  { id: "special", en: "Special characters", ru: "Спецсимволы",
    noteEn: "Quotes, backslashes, angle brackets, percent and template syntax: tests escaping on the way to the server and back.", noteRu: "Кавычки, обратные слэши, угловые скобки, проценты и шаблонный синтаксис: проверка экранирования на пути на сервер и обратно." },
  { id: "whitespace", en: "Whitespace only", ru: "Только пробельные символы",
    noteEn: "Spaces, tabs and line breaks: the composer must not send a message that is effectively empty.", noteRu: "Пробелы, табы и переводы строк: поле ввода не должно отправлять по сути пустое сообщение." },
];

const LOREM = ("lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua " +
  "ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat").split(" ");

export function ruler(length: number): string {
  let out = "";
  let i = 1;
  while (out.length < length) out += `[${String(i++).padStart(4, "0")}]`;
  return out.slice(0, length);
}

function repeatTo(unit: string, length: number): string {
  let out = "";
  while (out.length < length) out += unit;
  return out.slice(0, length);
}

export function clampParam(preset: StressPreset, n: number): number {
  const p = preset.param;
  if (!p) return 0;
  if (!Number.isFinite(n) || n < 1) return p.default;
  return Math.min(p.max, Math.floor(n));
}

export function generateStress(id: StressPresetId, n: number): string {
  switch (id) {
    case "ruler": return ruler(n);
    case "words": return Array.from({ length: n }, (_, i) => LOREM[i % LOREM.length]).join(" ");
    case "unbroken": return repeatTo("Abcdefghij0123456789", n);
    case "lines": return Array.from({ length: n }, (_, i) => `Line ${i + 1}`).join("\n");
    case "emoji":
      return [
        "Simple: 😀 😂 🙏 🔥 ✅ ❤️",
        "Skin tones: 👍 👍🏻 👍🏽 👍🏿",
        "ZWJ family: 👨‍👩‍👧‍👦 and couple: 👩‍❤️‍👨",
        "Flags: 🇦🇲 🇺🇸 🇯🇵 🏳️‍🌈",
        "Keycaps: 1️⃣ 2️⃣ #️⃣",
        "Repeated: " + "😀".repeat(40),
      ].join("\n");
    case "rtl":
      return [
        "مرحبا بالعالم, this is English 123 and more",
        "שלום עולם! Order #4821 shipped",
        "Name: محمد (Mohammed) - phone +971 50 123 4567",
        "\u202Bmixed embedding\u202C and plain text",
      ].join("\n");
    case "zalgo": {
      const marks = ["\u0300", "\u0301", "\u0302", "\u0303", "\u0308", "\u0315", "\u031B", "\u0334", "\u0335", "\u0336"];
      const word = (w: string) => Array.from(w).map((c, i) => c + marks.slice(0, 5 + ((i * 3) % 5)).join("") + marks[(i * 7) % marks.length].repeat(6)).join("");
      return [word("Hello"), word("Messenger"), word("Overflow")].join("\n");
    }
    case "invisible":
      return [
        "Zero width space: a\u200Bb",
        "Zero width joiner: a\u200Db",
        "Zero width non-joiner: a\u200Cb",
        "Soft hyphen: inter\u00ADnational",
        "No-break space: a\u00A0b",
        "BOM: \uFEFFtext",
        "Only invisible: \u200B\u200B\u200B",
      ].join("\n");
    case "scripts":
      return [
        "中文：你好，世界", "日本語：こんにちは世界", "한국어: 안녕하세요 세계",
        "ไทย: สวัสดีชาวโลกนี่คือข้อความภาษาไทยที่ยาวมาก", "हिन्दी: नमस्ते दुनिया",
        "Հայերեն՝ Բարեւ աշխարհ", "Русский: Привет, мир", "Ελληνικά: Γειά σου Κόσμε",
      ].join("\n");
    case "special":
      return [
        `Quotes: "double" 'single' \`backtick\` “curly” ‘curly’`,
        "Backslashes: C:\\Users\\test\\file.txt and \\n literal",
        "Angle brackets: <b>bold</b> a < b > c & d &amp; e",
        "Percent: 100% %s %d %20 %%",
        "Template: ${value} {{value}} {0} <%= value %>",
        "Null-like: \\0 NULL null undefined",
      ].join("\n");
    case "whitespace":
      return "   \t  \n \n\t\t\n    ";
  }
}
