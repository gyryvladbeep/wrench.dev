import { generateHash, HASH_ALGORITHMS, HashAlgorithm } from "../tools/hash";
import { resolveInput } from "../lib/input";
import type { ParsedArgs } from "../lib/args";

const USAGE = "Использование: wrench hash <md5|sha1|sha256|sha512> [input] [--file <path>]";

// Принимает алгоритм в любом привычном написании (md5, sha1, sha-1,
// SHA256...) и приводит к каноничному виду, который ждёт generateHash()
// (см. HASH_ALGORITHMS в ../tools/hash) — те же значения, что показывает
// веб-инструмент, но человек в терминале почти всегда наберёт без дефиса.
const ALIASES: Record<string, HashAlgorithm> = {
  md5: "MD5",
  sha1: "SHA-1",
  "sha-1": "SHA-1",
  sha256: "SHA-256",
  "sha-256": "SHA-256",
  sha512: "SHA-512",
  "sha-512": "SHA-512",
};

export async function runHash(args: ParsedArgs): Promise<number> {
  const [algArg, ...rest] = args.positionals;
  const algorithm = algArg ? ALIASES[algArg.toLowerCase()] : undefined;
  if (!algorithm) {
    console.error(USAGE);
    console.error(`Доступные алгоритмы: ${HASH_ALGORITHMS.join(", ")}`);
    return 1;
  }

  let input: string;
  try {
    input = await resolveInput(rest[0], args.flags);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  console.log(generateHash(input, algorithm));
  return 0;
}
