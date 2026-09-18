import { randomUUID } from "crypto";

// Зеркалит components/tools/UuidGeneratorTool.tsx (crypto.randomUUID()
// в браузере) — Node имеет тот же randomUUID() в built-in crypto,
// UUID v4, криптографически стойкий.

export function generateUuid(): string {
  return randomUUID();
}
