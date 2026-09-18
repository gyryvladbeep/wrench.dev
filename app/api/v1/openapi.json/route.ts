import { NextResponse } from "next/server";
import { buildOpenApiSpec } from "@/lib/api-catalog";

// Без собственного rate-лимита: в отличие от /api/v1/tools*, тут нечего
// защищать сверх агрессивного публичного кеша ниже (5 запросов в
// секунду ничего не стоят серверу — это статически посчитанный объект,
// без обращения к каким-либо данным) — тот же необременённый лимитом
// статус, что уже у app/robots.ts и app/sitemap.ts.
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(buildOpenApiSpec(), {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
