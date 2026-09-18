import { createHash } from "crypto";

// Зеркалит components/tools/HashGeneratorTool.tsx — тот же набор
// алгоритмов (MD5/SHA-1/SHA-256/SHA-512). В браузере MD5 требует
// чистого JS (Web Crypto его не поддерживает), в Node — обычный
// crypto.createHash("md5"), встроенный, без внешних зависимостей.

export const HASH_ALGORITHMS = ["MD5", "SHA-1", "SHA-256", "SHA-512"] as const;
export type HashAlgorithm = (typeof HASH_ALGORITHMS)[number];

const NODE_ALGO: Record<HashAlgorithm, string> = {
  MD5: "md5",
  "SHA-1": "sha1",
  "SHA-256": "sha256",
  "SHA-512": "sha512",
};

export function generateHash(input: string, algorithm: HashAlgorithm): string {
  return createHash(NODE_ALGO[algorithm]).update(input, "utf-8").digest("hex");
}
