export type JitterMode = "none" | "full" | "equal" | "decorrelated";

export interface BackoffInput {
  baseMs: number;
  factor: number;
  maxMs: number;
  attempts: number;
  jitter: JitterMode;
  seed: number;
}

export interface BackoffRow {
  attempt: number;
  /** Задержка до применения jitter (с ограничением maxMs). */
  nominalMs: number;
  minMs: number;
  maxMs: number;
  /** Пример при заданном seed. */
  sampleMs: number;
  cumulativeMinMs: number;
  cumulativeMaxMs: number;
  capped: boolean;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function backoffTable(input: BackoffInput): BackoffRow[] {
  const rnd = mulberry32(input.seed);
  const rows: BackoffRow[] = [];
  let cumMin = 0, cumMax = 0, prevSample = input.baseMs;
  for (let i = 1; i <= input.attempts; i++) {
    const raw = input.baseMs * Math.pow(input.factor, i - 1);
    const nominal = Math.min(input.maxMs, raw);
    let min = nominal, max = nominal, sample = nominal;
    if (input.jitter === "full") { min = 0; max = nominal; sample = rnd() * nominal; }
    else if (input.jitter === "equal") { min = nominal / 2; max = nominal; sample = nominal / 2 + rnd() * (nominal / 2); }
    else if (input.jitter === "decorrelated") {
      min = input.baseMs; max = Math.min(input.maxMs, Math.max(input.baseMs, prevSample * 3));
      sample = Math.min(input.maxMs, input.baseMs + rnd() * Math.max(0, prevSample * 3 - input.baseMs));
    }
    prevSample = sample;
    cumMin += min; cumMax += max;
    rows.push({
      attempt: i, nominalMs: Math.round(nominal), minMs: Math.round(min), maxMs: Math.round(max), sampleMs: Math.round(sample),
      cumulativeMinMs: Math.round(cumMin), cumulativeMaxMs: Math.round(cumMax), capped: raw >= input.maxMs,
    });
  }
  return rows;
}

export function firstCappedAttempt(rows: BackoffRow[]): number | null {
  return rows.find((r) => r.capped)?.attempt ?? null;
}

export function fmtMs(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  const s = ms / 1000;
  if (s < 60) return `${Math.round(s * 10) / 10} s`;
  const m = Math.floor(s / 60);
  return `${m} min ${Math.round(s - m * 60)} s`;
}
