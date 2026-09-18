import { requestJson, CliHttpError } from "../lib/http";
import { resolveBaseUrl, resolveToken } from "../lib/config";
import { flagString } from "../lib/args";
import type { ParsedArgs } from "../lib/args";

const USAGE =
  "Использование:\n" +
  "  wrench webhook create [--name <name>] [--token <token>]\n" +
  "  wrench webhook requests <slug> [--token <token>]\n\n" +
  "Повторный create с тем же --name очищает историю запросов существующего\n" +
  "бина, а не создаёт новый (см. .github/actions/wrench-webhook-bin для CI-варианта).";

// Обёртка над POST /api/v1/webhook-bins и GET /api/v1/webhook-bins/{slug}/requests
// — обе требуют личный токен (Profile -> Settings -> API tokens), см.
// app/api/v1/webhook-bins/route.ts и app/api/v1/webhook-bins/[slug]/requests/route.ts.
export async function runWebhook(args: ParsedArgs): Promise<number> {
  const [sub, slug] = args.positionals;

  const token = resolveToken(args.flags);
  if (!token) {
    console.error(tokenMissingMessage());
    return 1;
  }

  const baseUrl = resolveBaseUrl(args.flags);
  try {
    if (sub === "create") {
      const name = flagString(args.flags, "name");
      const data = await requestJson(`${baseUrl}/api/v1/webhook-bins`, { method: "POST", token, body: name ? { name } : {} });
      console.log(JSON.stringify(data, null, 2));
      return 0;
    }
    if (sub === "requests" && slug) {
      const data = await requestJson(`${baseUrl}/api/v1/webhook-bins/${encodeURIComponent(slug)}/requests`, { token });
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
