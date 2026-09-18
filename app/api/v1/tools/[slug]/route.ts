import { NextRequest, NextResponse } from "next/server";
import { getPublicToolDetail, API_RATE_LIMIT, API_RATE_LIMIT_WINDOW_MS } from "@/lib/api-catalog";
import { checkRateLimit, getClientIp, rateLimitHeaders } from "@/lib/api-rate-limit";

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(req: NextRequest, props: RouteParams) {
  const { slug } = await props.params;
  const ip = getClientIp(req.headers);
  // Общий счётчик с /api/v1/tools (тот же префикс "tools:") — один
  // лимит на весь публичный каталог инструментов, а не отдельный
  // бюджет на каждый маршрут, который позволил бы обойти лимит списка,
  // просто дёргая detail-эндпоинт в цикле по всем слагам вместо этого.
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

  const tool = getPublicToolDetail(slug);
  if (!tool) {
    return NextResponse.json(
      { error: "Tool not found", slug },
      { status: 404, headers: { ...CORS_HEADERS, ...rlHeaders } }
    );
  }

  return NextResponse.json(tool, {
    headers: {
      ...CORS_HEADERS,
      ...rlHeaders,
      "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
    },
  });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
