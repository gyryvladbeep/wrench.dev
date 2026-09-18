// ═══════════════════════════════════════════════════════════════
// Базовый URL и личный токен — из флага (--base-url/--token), иначе
// из переменной окружения (WRENCH_BASE_URL/WRENCH_API_TOKEN), иначе
// дефолт/undefined. Флаг важнее env — тот же приоритет, что и у
// большинства CLI (env — для CI-шага целиком, флаг — для разового
// переопределения одной команды).
// ═══════════════════════════════════════════════════════════════

import { flagString } from "./args";

const DEFAULT_BASE_URL = "https://wrench-branch.vercel.app";

export function resolveBaseUrl(flags: Record<string, string | boolean>): string {
  return flagString(flags, "base-url") ?? process.env.WRENCH_BASE_URL ?? DEFAULT_BASE_URL;
}

export function resolveToken(flags: Record<string, string | boolean>): string | undefined {
  return flagString(flags, "token") ?? process.env.WRENCH_API_TOKEN;
}
