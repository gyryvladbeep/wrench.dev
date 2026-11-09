export interface ProbeStorage {
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface ProbeResult {
  /** Сколько символов значения удалось записать под одним ключом. */
  chars: number;
  /** Сколько попыток записи потребовалось. */
  attempts: number;
  /** Достигнут ли предел проверки (квота не найдена). */
  capped: boolean;
}

export const PROBE_KEY = "__wrench_quota_probe__";

function tryWrite(storage: ProbeStorage, key: string, n: number): boolean {
  try { storage.setItem(key, "x".repeat(n)); return true; } catch { return false; }
}

/**
 * Находит максимальную длину значения: удвоение, затем двоичный поиск с точностью до 1 КБ.
 * Ключ пробы всегда удаляется.
 */
export function probeStorage(storage: ProbeStorage, maxChars = 32 * 1024 * 1024, key = PROBE_KEY): ProbeResult {
  let attempts = 0;
  const write = (n: number) => { attempts++; return tryWrite(storage, key, n); };
  try {
    let ok = 1024;
    if (!write(ok)) return { chars: 0, attempts, capped: false };
    let bad = -1;
    while (ok < maxChars) {
      const next = Math.min(ok * 2, maxChars);
      if (write(next)) ok = next; else { bad = next; break; }
    }
    if (bad === -1) return { chars: ok, attempts, capped: true };
    while (bad - ok > 1024) {
      const mid = Math.floor((ok + bad) / 2);
      if (write(mid)) ok = mid; else bad = mid;
    }
    return { chars: ok, attempts, capped: false };
  } finally {
    try { storage.removeItem(key); } catch { /* ключ мог не записаться */ }
  }
}
