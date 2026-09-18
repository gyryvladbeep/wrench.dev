import { NextRequest, NextResponse } from "next/server";
import { listPublicTools, API_RATE_LIMIT, API_RATE_LIMIT_WINDOW_MS } from "@/lib/api-catalog";
import { checkRateLimit, getClientIp, rateLimitHeaders } from "@/lib/api-rate-limit";

// Публичный, полностью анонимный, бесплатный эндпоинт — тот же дух, что
// уже есть у /api/badge/[username] (SVG-бейдж без авторизации), только
// тут отдаём JSON. CORS открыт (Access-Control-Allow-Origin: *) — это
// осознанно read-only каталог метаданных без cookies/сессии, чужому
// скрипту/curl/CI-шагу нечего "украсть", в отличие от остального сайта.
export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(`tools:${ip}`, API_RATE_LIMIT, API_RATE_LIMIT_WINDOW_MS);
  const rlHeaders = rateLimitHeaders(rl);

  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      {
        status: 429,
        headers: {
          ...CORS_HEADERS,
          ...rlHeaders,
          "Retry-After": String(Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000))),
        },
      }
    );
  }

  const category = req.nextUrl.searchParams.get("category") ?? undefined;
  const tools = listPublicTools(category);

  return NextResponse.json(
    { count: tools.length, tools },
    {
      headers: {
        ...CORS_HEADERS,
        ...rlHeaders,
        // Каталог инструментов меняется редко (новый релиз, не пользовательские
        // данные) — короткий публичный кеш снижает нагрузку от повторных
        // запросов без риска отдать надолго устаревший список.
        "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
