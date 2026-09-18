import { encodeUrl, decodeUrl } from "../tools/url";
import { resolveInput } from "../lib/input";
import type { ParsedArgs } from "../lib/args";

const USAGE = "Использование: wrench url <encode|decode> [input] [--file <path>]";

export async function runUrl(args: ParsedArgs): Promise<number> {
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

  const result = sub === "encode" ? encodeUrl(input) : decodeUrl(input);
  if (!result.ok) {
    console.error(result.error);
    return 1;
  }
  console.log(result.value);
  return 0;
}
