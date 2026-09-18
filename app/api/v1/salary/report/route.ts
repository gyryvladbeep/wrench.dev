import { NextRequest, NextResponse } from "next/server";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { checkRateLimit, getClientIp, rateLimitHeaders } from "@/lib/api-rate-limit";
import { API_RATE_LIMIT, API_RATE_LIMIT_WINDOW_MS } from "@/lib/api-catalog";
import { sortRoleReportRows, SalaryRoleReportRow, SalaryCountryReportRow } from "@/lib/salary-report";

// ═══════════════════════════════════════════════════════════════
// JSON-версия app/[locale]/salary/report/page.tsx (пункт 23) — тот же
// вопрос "покажи весь срез рынка одним запросом", что решает та
// страница для человека, только для CLI/CI-скрипта (`wrench salary
// report`). Делит rate-limit bucket "salary:" с /api/v1/salary — тот
// же приём, что у /api/v1/tools и /api/v1/tools/[slug] (общий bucket,
// см. комментарий в app/api/v1/tools/[slug]/route.ts), чтобы нельзя
// было обойти лимит одного эндпоинта, дёргая соседний.
export const runtime = "nodejs";

const CORS_HEADERS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" };

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

  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Salary data is not configured on this server." }, { status: 500, headers: { ...CORS_HEADERS, ...rlHeaders } });
  }

  const [roleResult, countryResult, countResult] = await Promise.all([
    supabase.rpc("get_salary_report_by_role"),
    supabase.rpc("get_salary_report_by_country"),
    supabase.rpc("get_salary_submission_count"),
  ]);

  if (roleResult.error || countryResult.error || countResult.error) {
    return NextResponse.json({ error: "Failed to fetch salary report." }, { status: 500, headers: { ...CORS_HEADERS, ...rlHeaders } });
  }

  const byRole = sortRoleReportRows((roleResult.data as SalaryRoleReportRow[] | null) ?? []);
  const byCountry = (countryResult.data as SalaryCountryReportRow[] | null) ?? [];
  const totalCount = (countResult.data as number | null) ?? 0;

  return NextResponse.json(
    { totalCount, byRole, byCountry },
    { headers: { ...CORS_HEADERS, ...rlHeaders, "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600" } }
  );
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
