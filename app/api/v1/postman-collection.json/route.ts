import { NextResponse } from "next/server";
import { buildPostmanCollection } from "@/lib/api-catalog";

// Та же причина отсутствия отдельного rate-лимита, что и у
// /api/v1/openapi.json/route.ts — статический, дёшево пересчитываемый
// объект под агрессивным публичным кешем.
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(buildPostmanCollection(), {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      // Content-Disposition, а не просто JSON-ответ — так клик по ссылке
      // "Скачать Postman-коллекцию" на /docs сразу предлагает браузеру
      // сохранить файл с осмысленным именем, а не открыть JSON в новой
      // вкладке (Postman всё равно принимает и то, и другое через Import).
      "Content-Disposition": 'attachment; filename="wrench-branch-api.postman_collection.json"',
    },
  });
}
