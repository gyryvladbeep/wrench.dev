// ═══════════════════════════════════════════════════════════════
// Приоритет источника входных данных, единый для всех локальных
// команд (json/base64/jwt/hash/url/timestamp) и для --routes у
// `mock create`: явное значение (позиционный аргумент или, для mock,
// --routes) -> --file <path> -> stdin. Тот порядок, которого ждёшь
// от Unix-утилиты — пайп работает по умолчанию без флагов, явный
// аргумент — для разового вызова без пайпа.
// ═══════════════════════════════════════════════════════════════

import { readFileSync } from "fs";
import { flagString } from "./args";

export async function resolveInput(explicit: string | undefined, flags: Record<string, string | boolean>): Promise<string> {
  if (explicit !== undefined) return explicit;

  const filePath = flagString(flags, "file");
  if (filePath) {
    try {
      return readFileSync(filePath, "utf-8");
    } catch (err) {
      throw new Error(`Не удалось прочитать файл ${filePath}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (!process.stdin.isTTY) {
    return await readStdin();
  }

  throw new Error("Нет входных данных — передайте их аргументом, через --file <path> или пайпом (stdin).");
}

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data.replace(/\n$/, "")));
    process.stdin.on("error", reject);
  });
}
