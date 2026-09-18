import { NextRequest, NextResponse } from "next/server";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { checkRateLimit, getClientIp, rateLimitHeaders } from "@/lib/api-rate-limit";
import { API_RATE_LIMIT, API_RATE_LIMIT_WINDOW_MS } from "@/lib/api-catalog";
import { ROLE_TAGS } from "@/lib/profile-roles";
import { SENIORITY_LEVELS, COUNTRIES } from "@/lib/salary-options";

// ═══════════════════════════════════════════════════════════════
// Публичный, анонимный, read-only эндпоинт поверх get_salary_stats()
// (supabase/salary-calculator-migration.sql) — та же агрегированная
// статистика, что и на /salary, просто как JSON вместо HTML-формы.
// Тот же принцип, что и /api/v1/tools (см. подробный комментарий там):
// открытый CORS, rate-limit по IP, никакой сессии/cookies не нужно —
// сама функция уже возвращает только агрегаты (порог анонимности
// count(*) >= 3, см. миграцию), сырые записи никогда не покидают базу.
//
// Основной потребитель — CLI (`wrench salary stats`, cli/src/commands/salary.ts)
// и любой внешний CI/скрипт, которому нужна одна конкретная комбинация
// роль+уровень+страна, а не весь отчёт целиком (для этого — /api/v1/salary/report).
export const runtime = "nodejs";

const CORS_HEADERS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" };

const ROLE_IDS = new Set(ROLE_TAGS.map((r) => r.id));
const SENIORITY_IDS = new Set(SENIORITY_LEVELS.map((s) => s.id));
const COUNTRY_IDS = new Set(COUNTRIES.map((c) => c.id));

export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(`salary:${ip}`, API_RATE_LIMIT, API_RATE_LIMIT_WINDOW_MS);
  const rlHeaders = rateLimitHeaders(rl);

  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429, headers: { ...CORS_HEADERS, ...rlHeaders, "Retry-After": String(Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000))) } }
    );
  }

  const role = req.nextUrl.searchParams.get("role") ?? "";
  const seniority = req.nextUrl.searchParams.get("seniority") || null;
  const country = req.nextUrl.searchParams.get("country") || null;

  if (!ROLE_IDS.has(role)) {
    return NextResponse.json(
      { error: `\`role\` is required and must be one of: ${[...ROLE_IDS].join(", ")}.` },
      { status: 400, headers: { ...CORS_HEADERS, ...rlHeaders } }
    );
  }
  if (seniority !== null && !SENIORITY_IDS.has(seniority)) {
    return NextResponse.json(
      { error: `\`seniority\` must be one of: ${[...SENIORITY_IDS].join(", ")}.` },
      { status: 400, headers: { ...CORS_HEADERS, ...rlHeaders } }
    );
  }
  if (country !== null && !COUNTRY_IDS.has(country)) {
    return NextResponse.json(
      { error: `\`country\` must be one of: ${[...COUNTRY_IDS].join(", ")}.` },
      { status: 400, headers: { ...CORS_HEADERS, ...rlHeaders } }
    );
  }

  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Salary data is not configured on this server." }, { status: 500, headers: { ...CORS_HEADERS, ...rlHeaders } });
  }

  const { data, error } = await supabase.rpc("get_salary_stats", { p_role: role, p_seniority: seniority, p_country: country });
  if (error || !data) {
    return NextResponse.json({ error: "Failed to fetch salary stats." }, { status: 500, headers: { ...CORS_HEADERS, ...rlHeaders } });
  }

  const stats = Array.isArray(data) ? data[0] : data;

  return NextResponse.json(
    { role, seniority, country, ...stats },
    { headers: { ...CORS_HEADERS, ...rlHeaders, "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600" } }
  );
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
