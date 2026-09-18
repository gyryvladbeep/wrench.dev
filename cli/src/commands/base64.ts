import { encodeBase64, decodeBase64 } from "../tools/base64";
import { resolveInput } from "../lib/input";
import type { ParsedArgs } from "../lib/args";

const USAGE = "Использование: wrench base64 <encode|decode> [input] [--file <path>]";

export async function runBase64(args: ParsedArgs): Promise<number> {
  const [sub, ...rest] = args.positionals;
  if (sub !== "encode" && sub !== "decode") {
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

  const result = sub === "encode" ? encodeBase64(input) : decodeBase64(input);
  if (!result.ok) {
    console.error(result.error);
    return 1;
  }
  console.log(result.value);
  return 0;
}
