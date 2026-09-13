import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Публичный, полностью анонимный эндпоинт — сюда приходят реальные
// вызовы из чужих тестов/curl/CI, а не из фронтенда сайта, поэтому
// никакой auth-проверки здесь нет и не должно быть. Единственная
// защита — RLS на mock_routes/mock_endpoints (см.
// supabase/mock-api-migration.sql): достать конкретный маршрут можно
// только точным совпадением slug+method+path через SECURITY DEFINER
// функцию get_mock_route(), а не произвольным чтением таблиц.
export const runtime = "nodejs";

interface RouteParams {
  params: { slug: string; path?: string[] };
}

async function handle(req: NextRequest, { params }: RouteParams) {
  const slug = params.slug;
  const path = "/" + (params.path ?? []).join("/");
  const method = req.method.toUpperCase();

  const supabase = createServerSupabaseClient();

  let route: { status_code: number; response_body: string; delay_ms: number } | null = null;
  try {
    const { data, error } = await supabase.rpc("get_mock_route", {
      p_slug: slug,
      p_method: method,
      p_path: path,
    });
    if (error) throw error;
    route = (data && data[0]) ?? null;
  } catch {
    // .rpc() / .from() отсутствуют у заглушки createServerSupabaseClient(),
    // которая отдаётся, когда переменные окружения Supabase не заданы
    // (см. lib/supabase/server.ts) — в такой среде сервис моков
    // недоступен целиком, и это стоит сказать прямо, а не падать 500-й.
    return NextResponse.json(
      { error: "Mock API service is not configured in this environment." },
      { status: 503 }
    );
  }

  if (!route) {
    return NextResponse.json(
      {
        error: `No mock route configured for ${method} ${path} on this endpoint.`,
        hint: "Check the method and path match exactly what you configured on /mock-api, including a leading slash.",
      },
      { status: 404 }
    );
  }

  if (route.delay_ms > 0) {
    // Верхняя граница задержки (5000мс) закреплена ограничением
    // delay_ms в самой таблице (mock_routes_delay_check) — Math.min
    // здесь просто вторая линия защиты на случай, если это когда-нибудь
    // изменится без синхронной правки этого файла.
    await new Promise((resolve) => setTimeout(resolve, Math.min(route!.delay_ms, 5000)));
  }

  let body: unknown = route.response_body;
  try {
    body = JSON.parse(route.response_body);
  } catch {
    // Тело сохранялось уже провалидированным как JSON на фронтенде
    // (см. components/mock-api/MockApiClient.tsx), так что сюда мы
    // попадаем только в исключительном случае — отдаём как есть строкой,
    // а не роняем запрос.
  }

  return NextResponse.json(body, { status: route.status_code });
}

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE };
