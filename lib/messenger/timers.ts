export type TimerMode = "debounce" | "throttle";

export interface TimerInput {
  events: number[];
  mode: TimerMode;
  waitMs: number;
  leading: boolean;
  trailing: boolean;
}

export interface Fire {
  atMs: number;
  edge: "leading" | "trailing";
  /** Время события, чьи данные получил вызов. */
  forEventMs: number;
}

export function parseTimes(text: string): number[] {
  return text.split(/[\s,;]+/).filter(Boolean).map(Number).filter((n) => Number.isFinite(n) && n >= 0).sort((a, b) => a - b);
}

/**
 * Модель в духе lodash/underscore.
 * debounce: окно ожидания сдвигается с каждым событием; leading срабатывает на первом событии окна,
 * trailing - через waitMs после последнего события, если после leading были ещё события.
 * throttle: окно длиной waitMs открывается событием; leading срабатывает сразу, trailing - в конце окна
 * (если были события после leading), и тогда открывается новое окно.
 */
export function simulate(input: TimerInput): Fire[] {
  const { events, waitMs, leading, trailing } = input;
  const fires: Fire[] = [];
  if (input.mode === "debounce") {
    let active = false, pending = false, due = 0, lastEvent = 0;
    for (const t of events) {
      if (active && t >= due) {
        if (trailing && pending) fires.push({ atMs: due, edge: "trailing", forEventMs: lastEvent });
        active = false; pending = false;
      }
      if (!active) {
        active = true;
        if (leading) fires.push({ atMs: t, edge: "leading", forEventMs: t }); else pending = true;
      } else pending = true;
      lastEvent = t;
      due = t + waitMs;
    }
    if (active && trailing && pending) fires.push({ atMs: due, edge: "trailing", forEventMs: lastEvent });
    return fires;
  }
  // throttle
  let windowEnd: number | null = null, pending = false, lastEvent = 0;
  const closeWindowsUpTo = (t: number) => {
    while (windowEnd !== null && t >= windowEnd) {
      if (trailing && pending) {
        fires.push({ atMs: windowEnd, edge: "trailing", forEventMs: lastEvent });
        pending = false;
        windowEnd = windowEnd + waitMs;
      } else { windowEnd = null; pending = false; }
    }
  };
  for (const t of events) {
    closeWindowsUpTo(t);
    if (windowEnd === null) {
      windowEnd = t + waitMs;
      if (leading) fires.push({ atMs: t, edge: "leading", forEventMs: t }); else pending = true;
    } else pending = true;
    lastEvent = t;
  }
  closeWindowsUpTo(Number.MAX_SAFE_INTEGER);
  return fires;
}
