import { requestJson, CliHttpError } from "../lib/http";
import { resolveBaseUrl } from "../lib/config";
import { flagString } from "../lib/args";
import type { ParsedArgs } from "../lib/args";

const USAGE =
  "Использование:\n" +
  "  wrench salary stats --role <role> [--seniority <level>] [--country <code>]\n" +
  "  wrench salary report\n\n" +
  "Список ролей/уровней/стран — на https://wrench-branch.vercel.app/salary";

// Обёртка над /api/v1/salary (одна комбинация role+seniority+country)
// и /api/v1/salary/report (весь срез сразу, пункт 23) — токен не нужен,
// обе публичные и анонимные, см. комментарии в app/api/v1/salary/route.ts
// и app/api/v1/salary/report/route.ts.
export async function runSalary(args: ParsedArgs): Promise<number> {
  const [sub] = args.positionals;
  const baseUrl = resolveBaseUrl(args.flags);

  try {
    if (sub === "stats") {
      const role = flagString(args.flags, "role");
      if (!role) {
        console.error("Нужен --role <role>.\n");
        console.error(USAGE);
        return 1;
      }
      const params = new URLSearchParams({ role });
      const seniority = flagString(args.flags, "seniority");
      const country = flagString(args.flags, "country");
      if (seniority) params.set("seniority", seniority);
      if (country) params.set("country", country);

      const data = await requestJson(`${baseUrl}/api/v1/salary?${params.toString()}`);
      console.log(JSON.stringify(data, null, 2));
      return 0;
    }
    if (sub === "report") {
      const data = await requestJson(`${baseUrl}/api/v1/salary/report`);
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
