import { formatJson, minifyJson, validateJson } from "../tools/json";
import { resolveInput } from "../lib/input";
import type { ParsedArgs } from "../lib/args";

const USAGE = "Использование: wrench json <format|minify|validate> [input] [--file <path>]";

export async function runJson(args: ParsedArgs): Promise<number> {
  const [sub, ...rest] = args.positionals;
  if (sub !== "format" && sub !== "minify" && sub !== "validate") {
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

  const result = sub === "format" ? formatJson(input) : sub === "minify" ? minifyJson(input) : validateJson(input);
  if (!result.ok) {
    console.error(result.error);
    return 1;
  }
  console.log(result.value);
  return 0;
}
