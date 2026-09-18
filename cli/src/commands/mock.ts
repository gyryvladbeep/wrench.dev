import { requestJson, CliHttpError } from "../lib/http";
import { resolveBaseUrl, resolveToken } from "../lib/config";
import { resolveInput } from "../lib/input";
import { flagString } from "../lib/args";
import type { ParsedArgs } from "../lib/args";

const USAGE =
  "Использование:\n" +
  "  wrench mock create --name <name> [--routes '<json>'] [--file <path>] [--token <token>]\n\n" +
  "routes без --routes читается из --file или из stdin. Формат — JSON-массив:\n" +
  '  [{"method":"GET","path":"/ping","status_code":200,"response_body":"{\\"ok\\":true}"}]\n\n' +
  "Повторный вызов с тем же --name обновляет маршруты существующего мока,\n" +
  "а не создаёт новый (см. .github/actions/wrench-mock-api для CI-варианта).";

// Обёртка над POST /api/v1/mock-endpoints — нужен личный токен
// (Profile -> Settings -> API tokens), см. app/api/v1/mock-endpoints/route.ts.
export async function runMock(args: ParsedArgs): Promise<number> {
  const [sub] = args.positionals;
  if (sub !== "create") {
    console.error(USAGE);
    return 1;
  }

  const name = flagString(args.flags, "name");
  if (!name) {
    console.error("Нужен --name <name>.\n");
    console.error(USAGE);
    return 1;
  }

  const token = resolveToken(args.flags);
  if (!token) {
    console.error(tokenMissingMessage());
    return 1;
  }

  let routesRaw: string;
  try {
    routesRaw = await resolveInput(flagString(args.flags, "routes"), args.flags);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    console.error(USAGE);
    return 1;
  }

  let routes: unknown;
  try {
    routes = JSON.parse(routesRaw);
  } catch {
    console.error("`routes` должен быть валидным JSON-массивом — см. формат ниже.\n");
    console.error(USAGE);
    return 1;
  }

  const baseUrl = resolveBaseUrl(args.flags);
  try {
    const data = await requestJson(`${baseUrl}/api/v1/mock-endpoints`, { method: "POST", token, body: { name, routes } });
    console.log(JSON.stringify(data, null, 2));
    return 0;
  } catch (err) {
    printError(err);
    return 1;
  }
}

function tokenMissingMessage(): string {
  return "Нужен личный токен: --token <token> или переменная окружения WRENCH_API_TOKEN.\nПолучить токен: Profile -> Settings -> API tokens на wrench-branch.vercel.app.";
}

function printError(err: unknown) {
  if (err instanceof CliHttpError) {
    console.error(`Ошибка (${err.status || "network"}): ${err.message}`);
  } else {
    console.error(err instanceof Error ? err.message : String(err));
  }
}
