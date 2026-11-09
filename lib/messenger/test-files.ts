export type FileKind = "zero" | "random" | "text" | "png" | "jpg" | "gif" | "pdf" | "zip";

export const FILE_KINDS: { id: FileKind; ext: string; mime: string; labelEn: string; labelRu: string }[] = [
  { id: "zero", ext: "bin", mime: "application/octet-stream", labelEn: "Zero bytes filler (.bin)", labelRu: "Заполнение нулями (.bin)" },
  { id: "random", ext: "bin", mime: "application/octet-stream", labelEn: "Random bytes (.bin)", labelRu: "Случайные байты (.bin)" },
  { id: "text", ext: "txt", mime: "text/plain", labelEn: "Text filler (.txt)", labelRu: "Текстовое заполнение (.txt)" },
  { id: "png", ext: "png", mime: "image/png", labelEn: "PNG header + padding", labelRu: "Заголовок PNG + заполнение" },
  { id: "jpg", ext: "jpg", mime: "image/jpeg", labelEn: "JPEG header + padding", labelRu: "Заголовок JPEG + заполнение" },
  { id: "gif", ext: "gif", mime: "image/gif", labelEn: "GIF header + padding", labelRu: "Заголовок GIF + заполнение" },
  { id: "pdf", ext: "pdf", mime: "application/pdf", labelEn: "PDF header + padding", labelRu: "Заголовок PDF + заполнение" },
  { id: "zip", ext: "zip", mime: "application/zip", labelEn: "ZIP (empty archive header + padding)", labelRu: "ZIP (заголовок пустого архива + заполнение)" },
];

/** Максимум, который разумно собирать в памяти браузера. */
export const MAX_FILE_BYTES = 200 * 1024 * 1024;

const HEADERS: Partial<Record<FileKind, number[]>> = {
  png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  jpg: [0xff, 0xd8, 0xff, 0xe0],
  gif: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
  pdf: Array.from("%PDF-1.4\n").map((c) => c.charCodeAt(0)),
  zip: [0x50, 0x4b, 0x05, 0x06], // начало пустого архива (EOCD), дальше нули
};

export function clampSize(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(MAX_FILE_BYTES, Math.max(0, Math.floor(n)));
}

function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Строит файл ровно указанного размера в байтах. */
export function buildFile(kind: FileKind, size: number, seed = 1): Uint8Array {
  const n = clampSize(size);
  const out = new Uint8Array(n);
  if (kind === "random") {
    const rnd = seeded(seed);
    for (let i = 0; i < n; i++) out[i] = Math.floor(rnd() * 256);
    return out;
  }
  if (kind === "text") {
    const line = "The quick brown fox jumps over the lazy dog 0123456789\n";
    for (let i = 0; i < n; i++) out[i] = line.charCodeAt(i % line.length);
    return out;
  }
  const header = HEADERS[kind];
  if (header) {
    for (let i = 0; i < Math.min(header.length, n); i++) out[i] = header[i];
  }
  return out;
}

export interface BoundaryCase {
  label: string;
  bytes: number;
}

export function boundarySizes(limit: number): BoundaryCase[] {
  const l = clampSize(limit);
  const list: BoundaryCase[] = [
    { label: "limit - 1", bytes: Math.max(0, l - 1) },
    { label: "limit", bytes: l },
    { label: "limit + 1", bytes: Math.min(MAX_FILE_BYTES, l + 1) },
  ];
  return list;
}

export interface NamePreset {
  id: string;
  name: string;
  noteEn: string;
  noteRu: string;
}

export const NAME_PRESETS: NamePreset[] = [
  { id: "spaces", name: "my file  with   spaces.png", noteEn: "Multiple spaces", noteRu: "Несколько пробелов" },
  { id: "cyrillic", name: "отчёт_финал.pdf", noteEn: "Cyrillic name", noteRu: "Кириллица в имени" },
  { id: "emoji", name: "party-🎉.png", noteEn: "Emoji in the name", noteRu: "Эмодзи в имени" },
  { id: "long", name: "a".repeat(240) + ".txt", noteEn: "244 characters", noteRu: "244 символа" },
  { id: "double-ext", name: "photo.jpg.exe", noteEn: "Double extension", noteRu: "Двойное расширение" },
  { id: "no-ext", name: "README", noteEn: "No extension", noteRu: "Без расширения" },
  { id: "dots", name: "...hidden.name.", noteEn: "Leading and trailing dots", noteRu: "Точки в начале и конце" },
  { id: "quotes", name: "it's \"quoted\".txt", noteEn: "Quotes", noteRu: "Кавычки" },
  { id: "html", name: "<img src=x onerror=1>.png", noteEn: "HTML in the name", noteRu: "HTML в имени" },
  { id: "percent", name: "100%25 done#1?.txt", noteEn: "Percent, hash, question mark", noteRu: "Процент, решётка, вопрос" },
  { id: "rtl", name: "invoice‮gpj.exe", noteEn: "Right-to-left override", noteRu: "Переопределение направления RTL" },
  { id: "nfd", name: "café.txt", noteEn: "Decomposed é (NFD)", noteRu: "Разложенная é (NFD)" },
];

/** Имена, которые нельзя использовать в Windows. */
export const RESERVED_WIN = ["CON", "PRN", "AUX", "NUL", "COM1", "LPT1"];

export function humanBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}
