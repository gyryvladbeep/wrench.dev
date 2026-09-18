import { convertTimestamp } from "../tools/timestamp";
import { resolveInput } from "../lib/input";
import type { ParsedArgs } from "../lib/args";

const USAGE = "Использование: wrench timestamp <value> [--file <path>]\n  Число -> дата (ISO/UTC/локальная). Дата -> unix seconds/millis.";

export async function runTimestamp(args: ParsedArgs): Promise<number> {
  let input: string;
  try {
    input = await resolveInput(args.positionals[0], args.flags);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    console.error(USAGE);
    return 1;
  }

  const result = convertTimestamp(input);
  if (!result.ok) {
    console.error(result.error);
    return 1;
  }
  console.log(result.value);
  return 0;
}
