import { decodeJwt, formatJwtDecodeResult } from "../tools/jwt";
import { resolveInput } from "../lib/input";
import type { ParsedArgs } from "../lib/args";

const USAGE = "Использование: wrench jwt decode <token> [--file <path>]";

export async function runJwt(args: ParsedArgs): Promise<number> {
  const [sub, ...rest] = args.positionals;
  if (sub !== "decode") {
    console.error(USAGE);
    return 1;
  }

  let input: string;
  try {
    input = await resolveInput(rest[0], args.flags);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  const result = decodeJwt(input);
  console.log(formatJwtDecodeResult(result));
  return result.ok ? 0 : 1;
}
