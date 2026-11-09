export interface IdReading {
  type: string;
  epochMs: number;
  detail: string;
}

const MIN_MS = Date.UTC(2009, 0, 1);
const MAX_MS = Date.UTC(2100, 0, 1);
const plausible = (ms: number) => Number.isFinite(ms) && ms >= MIN_MS && ms <= MAX_MS;

const DISCORD_EPOCH = 1420070400000n;
const TWITTER_EPOCH = 1288834974657n;
const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function decodeId(raw: string): IdReading[] {
  const id = raw.trim();
  const out: IdReading[] = [];
  if (!id) return out;

  // Slack ts: секунды.микросекунды (последняя часть - счётчик внутри секунды)
  const slack = /^(\d{10})\.(\d{6})$/.exec(id);
  if (slack) out.push({ type: "Slack ts", epochMs: Number(slack[1]) * 1000, detail: `sequence ${slack[2]}` });

  // UUID v7: первые 48 бит - миллисекунды Unix
  const uuid = /^([0-9a-f]{8})-?([0-9a-f]{4})-?([0-9a-f]{4})-?([0-9a-f]{4})-?([0-9a-f]{12})$/i.exec(id);
  if (uuid) {
    const version = parseInt(uuid[3][0], 16);
    if (version === 7) out.push({ type: "UUID v7", epochMs: parseInt(uuid[1] + uuid[2], 16), detail: "version 7" });
  }

  // ULID: 26 символов Crockford base32, первые 10 - миллисекунды
  if (/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(id)) {
    let ms = 0;
    for (const ch of id.slice(0, 10).toUpperCase()) ms = ms * 32 + CROCKFORD.indexOf(ch);
    if (plausible(ms)) out.push({ type: "ULID", epochMs: ms, detail: "first 10 characters" });
  }

  // MongoDB ObjectId: 24 hex, первые 4 байта - секунды
  if (/^[0-9a-f]{24}$/i.test(id)) {
    const sec = parseInt(id.slice(0, 8), 16);
    if (plausible(sec * 1000)) out.push({ type: "MongoDB ObjectId", epochMs: sec * 1000, detail: "first 4 bytes" });
  }

  // Snowflake: 17-19 цифр, две распространённые эпохи
  if (/^\d{17,19}$/.test(id)) {
    const n = BigInt(id);
    const discord = Number((n >> 22n) + DISCORD_EPOCH);
    const twitter = Number((n >> 22n) + TWITTER_EPOCH);
    if (plausible(discord)) out.push({ type: "Snowflake (Discord epoch)", epochMs: discord, detail: `worker ${Number((n >> 12n) & 0x3ffn)}, sequence ${Number(n & 0xfffn)}` });
    if (plausible(twitter)) out.push({ type: "Snowflake (Twitter epoch)", epochMs: twitter, detail: `worker ${Number((n >> 12n) & 0x3ffn)}, sequence ${Number(n & 0xfffn)}` });
  }

  // Unix время в секундах или миллисекундах
  if (/^\d{13}$/.test(id) && plausible(Number(id))) out.push({ type: "Unix milliseconds", epochMs: Number(id), detail: "13 digits" });
  if (/^\d{10}$/.test(id) && plausible(Number(id) * 1000)) out.push({ type: "Unix seconds", epochMs: Number(id) * 1000, detail: "10 digits" });

  return out;
}

export interface OrderReport {
  line: number;
  id: string;
  epochMs: number | null;
  type: string;
  status: "ok" | "out-of-order" | "undecoded";
}

/** Проверка: растёт ли время, закодированное в ID, от строки к строке (порядок ленты). */
export function checkOrder(lines: string[]): OrderReport[] {
  const out: OrderReport[] = [];
  let prev: number | null = null;
  lines.forEach((line, i) => {
    const id = line.trim();
    if (!id) return;
    const reading = decodeId(id)[0];
    if (!reading) {
      out.push({ line: i + 1, id, epochMs: null, type: "-", status: "undecoded" });
      return;
    }
    const status = prev !== null && reading.epochMs < prev ? "out-of-order" : "ok";
    if (prev === null || reading.epochMs > prev) prev = reading.epochMs;
    out.push({ line: i + 1, id, epochMs: reading.epochMs, type: reading.type, status });
  });
  return out;
}
