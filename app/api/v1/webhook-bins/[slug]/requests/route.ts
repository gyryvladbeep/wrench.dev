import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateApiRequest } from "@/lib/api-auth";
import { checkRateLimit, rateLimitHeaders } from "@/lib/api-rate-limit";

// ═══════════════════════════════════════════════════════════════
// Читает запросы, принятые бином, созданным через POST /api/v1/webhook-bins
// — то, ради чего GitHub Action вообще создаёт бин: "деплой отправил
// вебхук — проверь, что он реально долетел" одним curl-опросом в конце
// CI-шага, без захода в UI (см. .github/actions/wrench-webhook-bin/action.yml
// в README того каталога — пример опроса этого эндпоинта).
export const runtime = "nodejs";

const CORS_HEADERS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" };

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(req: NextRequest, props: RouteParams) {
  const { slug } = await props.params;
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status, headers: CORS_HEADERS });
  }

  const rl = checkRateLimit(`write:${auth.userId}`, 30, 60_000);
  const rlHeaders = rateLimitHeaders(rl);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429, headers: { ...CORS_HEADERS, ...rlHeaders, "Retry-After": String(Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000))) } }
    );
  }

  const admin = getSupabaseAdmin();

  // Владение проверяется явно (user_id = auth.userId), а не только
  // существование slug — в обход RLS через service-role клиент любой
  // валидный токен мог бы иначе прочитать ЧУЖОЙ бин по угаданному/
  // подсмотренному slug'у.
  const { data: bin } = await admin
    .from("webhook_bins")
    .select("id")
    .eq("slug", slug)
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (!bin) {
    return NextResponse.json({ error: "Webhook bin not found." }, { status: 404, headers: { ...CORS_HEADERS, ...rlHeaders } });
  }

  const { data: requests } = await admin
    .from("webhook_requests")
    .select("id, method, path, query, headers, body, content_type, source_ip, received_at")
    .eq("bin_id", bin.id)
    .order("received_at", { ascending: false });

  return NextResponse.json(
    { count: requests?.length ?? 0, requests: requests ?? [] },
    { headers: { ...CORS_HEADERS, ...rlHeaders } }
  );
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
