import { generateUuid } from "../tools/uuid";
import { flagString } from "../lib/args";
import type { ParsedArgs } from "../lib/args";

// --count генерирует сразу несколько UUID (по одному на строку) — то,
// что чаще всего реально нужно в терминале/скрипте (например, заполнить
// тестовые фикстуры), а не по одному вызову на каждый.
export async function runUuid(args: ParsedArgs): Promise<number> {
  const raw = flagString(args.flags, "count");
  const parsed = raw ? Number(raw) : 1;
  const count = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;

  for (let i = 0; i < count; i++) {
    console.log(generateUuid());
  }
  return 0;
}
