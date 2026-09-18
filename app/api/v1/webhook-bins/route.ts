import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateApiRequest } from "@/lib/api-auth";
import { checkRateLimit, rateLimitHeaders } from "@/lib/api-rate-limit";
import { siteConfig } from "@/lib/seo";
import { FREE_MAX_WEBHOOK_BINS, PRO_MAX_WEBHOOK_BINS } from "@/lib/tier-limits";

// ═══════════════════════════════════════════════════════════════
// Write-эндпоинт публичного API (пункт 13 — GitHub Action для Webhook
// Inspector), авторизован личным токеном — та же схема, что и у
// app/api/v1/mock-endpoints/route.ts (см. подробный комментарий там):
// service-role клиент вместо RLS, потому что у внешнего запроса нет
// Supabase-сессии.
//
// Идемпотентно по имени, но в отличие от mock-endpoints тут не
// "заменяем маршруты", а ОЧИЩАЕМ историю принятых запросов при
// повторном использовании того же имени — свежий CI-прогон должен
// видеть только вебхуки ИЗ ЭТОГО прогона, а не хвост от предыдущего
// (иначе "проверь, что вебхук пришёл" через GET .../requests могло бы
// молча зелениться на старых данных, даже если в этом прогоне вебхук
// вообще не долетел).
export const runtime = "nodejs";

const CORS_HEADERS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const WRITE_RATE_LIMIT = 30;
const WRITE_RATE_LIMIT_WINDOW_MS = 60_000;

export async function POST(req: NextRequest) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status, headers: CORS_HEADERS });
  }

  const rl = checkRateLimit(`write:${auth.userId}`, WRITE_RATE_LIMIT, WRITE_RATE_LIMIT_WINDOW_MS);
  const rlHeaders = rateLimitHeaders(rl);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429, headers: { ...CORS_HEADERS, ...rlHeaders, "Retry-After": String(Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000))) } }
    );
  }

  let body: { name?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400, headers: CORS_HEADERS });
  }

  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : "CI run";
  if (name.length > 100) {
    return NextResponse.json({ error: "`name` must be 100 characters or fewer." }, { status: 400, headers: CORS_HEADERS });
  }

  const admin = getSupabaseAdmin();

  const { data: existing } = await admin
    .from("webhook_bins")
    .select("id, slug")
    .eq("user_id", auth.userId)
    .eq("name", name)
    .maybeSingle();

  let binId: string;
  let slug: string;

  if (existing) {
    binId = existing.id;
    slug = existing.slug;
    await admin.from("webhook_requests").delete().eq("bin_id", binId);
  } else {
    const { data: sub } = await admin.from("subscriptions").select("plan, status").eq("user_id", auth.userId).maybeSingle();
    const isPro = sub?.plan === "pro" && sub?.status === "active";
    const maxBins = isPro ? PRO_MAX_WEBHOOK_BINS : FREE_MAX_WEBHOOK_BINS;

    const { count } = await admin
      .from("webhook_bins")
      .select("id", { count: "exact", head: true })
      .eq("user_id", auth.userId);
    if ((count ?? 0) >= maxBins) {
      return NextResponse.json(
        { error: `Webhook bin limit reached (${maxBins} on your plan). Reuse the same \`name\` to reset an existing bin, or delete one from /webhook-inspector first.` },
        { status: 403, headers: { ...CORS_HEADERS, ...rlHeaders } }
      );
    }

    slug = randomUUID().replace(/-/g, "").slice(0, 12);
    const { data: created, error: createErr } = await admin
      .from("webhook_bins")
      .insert({ user_id: auth.userId, slug, name })
      .select("id")
      .single();
    if (createErr || !created) {
      return NextResponse.json({ error: "Failed to create webhook bin." }, { status: 500, headers: { ...CORS_HEADERS, ...rlHeaders } });
    }
    binId = created.id;
  }

  return NextResponse.json(
    {
      id: binId,
      slug,
      name,
      url: `${siteConfig.url}/api/hook/${slug}`,
      requestsUrl: `${siteConfig.url}/api/v1/webhook-bins/${slug}/requests`,
    },
    { status: existing ? 200 : 201, headers: { ...CORS_HEADERS, ...rlHeaders } }
  );
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
