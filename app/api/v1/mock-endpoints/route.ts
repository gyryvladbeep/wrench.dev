import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateApiRequest } from "@/lib/api-auth";
import { checkRateLimit, rateLimitHeaders } from "@/lib/api-rate-limit";
import { siteConfig } from "@/lib/seo";
import {
  FREE_MAX_MOCK_ENDPOINTS, FREE_MAX_MOCK_ROUTES,
  PRO_MAX_MOCK_ENDPOINTS, PRO_MAX_MOCK_ROUTES,
} from "@/lib/tier-limits";

// ═══════════════════════════════════════════════════════════════
// Write-эндпоинт публичного API (пункт 13 из ROADMAP-BRAINSTORM.md —
// GitHub Action для Mock API) — единственный способ создать/обновить
// mock-эндпоинт БЕЗ браузерной сессии, авторизован личным токеном
// (Authorization: Bearer wrb_..., см. lib/api-auth.ts и
// components/profile/ApiTokensPanel.tsx). В остальном приложении
// mock_endpoints/mock_routes создаются напрямую с клиента через
// supabase-js под RLS (lib/hooks/useMockEndpoints.ts) — тут та же
// операция, но от лица сервера через service-role клиент, потому что
// у внешнего curl/CI-запроса нет Supabase-сессии для RLS.
//
// Идемпотентно по имени: повторный вызов с тем же `name` от того же
// пользователя обновляет маршруты СУЩЕСТВУЮЩЕГО эндпоинта, а не
// создаёт новый. Без этого CI-шаг, запускаемый на каждый push,
// упирался бы в FREE_MAX_MOCK_ENDPOINTS=1 уже на втором запуске —
// а так один и тот же именованный мок просто пересоздаётся с новыми
// маршрутами при каждом прогоне, ровно то поведение, которое нужно
// действию (см. .github/actions/wrench-mock-api/action.yml).
export const runtime = "nodejs";

const CORS_HEADERS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const WRITE_RATE_LIMIT = 30;
const WRITE_RATE_LIMIT_WINDOW_MS = 60_000;

const VALID_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

interface RouteInput {
  method: string;
  path: string;
  status_code?: number;
  response_body?: string;
  delay_ms?: number;
}

function validationError(message: string) {
  return NextResponse.json({ error: message }, { status: 400, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status, headers: CORS_HEADERS });
  }

  // Лимит по пользователю (не по IP, в отличие от /api/v1/tools) —
  // токен идентифицирует запрашивающего однозначно, а CI-раннеры могут
  // делить IP друг с другом или менять его между запусками.
  const rl = checkRateLimit(`write:${auth.userId}`, WRITE_RATE_LIMIT, WRITE_RATE_LIMIT_WINDOW_MS);
  const rlHeaders = rateLimitHeaders(rl);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429, headers: { ...CORS_HEADERS, ...rlHeaders, "Retry-After": String(Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000))) } }
    );
  }

  let body: { name?: unknown; routes?: unknown };
  try {
    body = await req.json();
  } catch {
    return validationError("Request body must be valid JSON.");
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return validationError("`name` is required.");
  if (name.length > 100) return validationError("`name` must be 100 characters or fewer.");

  if (!Array.isArray(body.routes) || body.routes.length === 0) {
    return validationError("`routes` must be a non-empty array.");
  }

  const admin = getSupabaseAdmin();

  const { data: sub } = await admin.from("subscriptions").select("plan, status").eq("user_id", auth.userId).maybeSingle();
  const isPro = sub?.plan === "pro" && sub?.status === "active";
  const maxEndpoints = isPro ? PRO_MAX_MOCK_ENDPOINTS : FREE_MAX_MOCK_ENDPOINTS;
  const maxRoutes = isPro ? PRO_MAX_MOCK_ROUTES : FREE_MAX_MOCK_ROUTES;

  if (body.routes.length > maxRoutes) {
    return validationError(`Too many routes: ${body.routes.length} given, max is ${maxRoutes} on your plan.`);
  }

  const routes: Required<RouteInput>[] = [];
  for (const raw of body.routes as RouteInput[]) {
    if (typeof raw !== "object" || raw === null) return validationError("Each route must be an object.");
    const method = typeof raw.method === "string" ? raw.method.toUpperCase() : "";
    if (!VALID_METHODS.has(method)) return validationError(`Invalid method: ${String(raw.method)}. Must be one of ${[...VALID_METHODS].join(", ")}.`);
    const path = typeof raw.path === "string" && raw.path.startsWith("/") ? raw.path : null;
    if (!path) return validationError("Each route's `path` must be a string starting with '/'.");
    const status_code = raw.status_code ?? 200;
    if (typeof status_code !== "number" || status_code < 100 || status_code > 599) {
      return validationError("`status_code` must be a number between 100 and 599.");
    }
    const delay_ms = raw.delay_ms ?? 0;
    if (typeof delay_ms !== "number" || delay_ms < 0 || delay_ms > 5000) {
      return validationError("`delay_ms` must be a number between 0 and 5000.");
    }
    const response_body = typeof raw.response_body === "string" ? raw.response_body : "{}";
    routes.push({ method, path, status_code, delay_ms, response_body });
  }

  // Идемпотентность по имени — см. комментарий вверху файла.
  const { data: existing } = await admin
    .from("mock_endpoints")
    .select("id, slug")
    .eq("user_id", auth.userId)
    .eq("name", name)
    .maybeSingle();

  let endpointId: string;
  let slug: string;

  if (existing) {
    endpointId = existing.id;
    slug = existing.slug;
    // Полная замена маршрутов при повторном запуске — тот же принцип
    // "пересоздать с нуля", что и у webhook-бина ниже (route.ts в
    // app/api/v1/webhook-bins) для сброшенной истории запросов:
    // предыдущий прогон CI не должен оставлять маршруты, которых в
    // ЭТОМ прогоне уже нет в конфиге.
    await admin.from("mock_routes").delete().eq("endpoint_id", endpointId);
  } else {
    const { count } = await admin
      .from("mock_endpoints")
      .select("id", { count: "exact", head: true })
      .eq("user_id", auth.userId);
    if ((count ?? 0) >= maxEndpoints) {
      return NextResponse.json(
        { error: `Mock endpoint limit reached (${maxEndpoints} on your plan). Reuse the same \`name\` to update an existing one, or delete one from /mock-api first.` },
        { status: 403, headers: { ...CORS_HEADERS, ...rlHeaders } }
      );
    }
    slug = randomUUID().replace(/-/g, "").slice(0, 12);
    const { data: created, error: createErr } = await admin
      .from("mock_endpoints")
      .insert({ user_id: auth.userId, slug, name })
      .select("id")
      .single();
    if (createErr || !created) {
      return NextResponse.json({ error: "Failed to create mock endpoint." }, { status: 500, headers: { ...CORS_HEADERS, ...rlHeaders } });
    }
    endpointId = created.id;
  }

  const { error: routesErr } = await admin
    .from("mock_routes")
    .insert(routes.map((r) => ({ endpoint_id: endpointId, ...r })));

  if (routesErr) {
    return NextResponse.json({ error: "Failed to save routes." }, { status: 500, headers: { ...CORS_HEADERS, ...rlHeaders } });
  }

  return NextResponse.json(
    {
      id: endpointId,
      slug,
      name,
      url: `${siteConfig.url}/api/mock/${slug}`,
      routes: routes.map((r) => ({ ...r, url: `${siteConfig.url}/api/mock/${slug}${r.path}` })),
    },
    { status: existing ? 200 : 201, headers: { ...CORS_HEADERS, ...rlHeaders } }
  );
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
