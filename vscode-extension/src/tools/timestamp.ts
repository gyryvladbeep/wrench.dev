// Зеркалит components/tools/TimestampConverterTool.tsx: тот же
// эвристический авто-детект направления конвертации, чтобы у команды
// палитры был один "умный" вход вместо двух отдельных команд.

export interface TimestampResult {
  ok: boolean;
  value?: string;
  error?: string;
}

function looksLikeMillis(digits: string): boolean {
  return digits.length >= 13;
}

// Число (секунды или миллисекунды) -> дата. Возвращает ISO/UTC/локальную
// строку.
function timestampToDate(trimmed: string): TimestampResult {
  const ms = looksLikeMillis(trimmed) ? Number(trimmed) : Number(trimmed) * 1000;
  const date = new Date(ms);
  if (isNaN(date.getTime())) return { ok: false, error: "Not a valid timestamp." };
  return {
    ok: true,
    value: [`ISO:   ${date.toISOString()}`, `UTC:   ${date.toUTCString()}`, `Local: ${date.toString()}`].join("\n"),
  };
}

// Дата (что угодно, что понимает Date()) -> unix seconds/millis.
function dateToTimestamp(input: string): TimestampResult {
  const date = new Date(input);
  if (isNaN(date.getTime())) return { ok: false, error: "Not a valid date." };
  return {
    ok: true,
    value: [`Seconds: ${Math.floor(date.getTime() / 1000)}`, `Millis:  ${date.getTime()}`].join("\n"),
  };
}

// Авто-детект: если вход — чисто цифры, трактуем как timestamp;
// иначе пробуем распарсить как дату.
export function convertTimestamp(input: string): TimestampResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: "Empty input." };
  if (/^\d+$/.test(trimmed)) return timestampToDate(trimmed);
  return dateToTimestamp(trimmed);
}
