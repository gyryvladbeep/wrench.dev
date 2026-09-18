import { requestJson, CliHttpError } from "../lib/http";
import { resolveBaseUrl } from "../lib/config";
import type { ParsedArgs } from "../lib/args";

const USAGE = "Использование:\n  wrench tools list\n  wrench tools get <slug>";

// Тонкая обёртка над публичным, анонимным /api/v1/tools и
// /api/v1/tools/{slug} — токен не нужен, см. комментарий в
// app/api/v1/tools/route.ts.
export async function runTools(args: ParsedArgs): Promise<number> {
  const [sub, slug] = args.positionals;
  const baseUrl = resolveBaseUrl(args.flags);

  try {
    if (sub === "list") {
      const data = await requestJson(`${baseUrl}/api/v1/tools`);
      console.log(JSON.stringify(data, null, 2));
      return 0;
    }
    if (sub === "get" && slug) {
      const data = await requestJson(`${baseUrl}/api/v1/tools/${encodeURIComponent(slug)}`);
      console.log(JSON.stringify(data, null, 2));
      return 0;
    }
    console.error(USAGE);
    return 1;
  } catch (err) {
    printError(err);
    return 1;
  }
}

function printError(err: unknown) {
  if (err instanceof CliHttpError) {
    console.error(`Ошибка (${err.status || "network"}): ${err.message}`);
  } else {
    console.error(err instanceof Error ? err.message : String(err));
  }
}
