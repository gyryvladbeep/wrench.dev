import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Публичный, полностью анонимный эндпоинт — сюда приходят реальные
// вебхуки от чужих сервисов (Stripe, GitHub, собственный бэкенд
// пользователя и т.п.), а не запросы с фронтенда сайта, поэтому
// никакой auth-проверки здесь нет и не должно быть. Единственная
// защита — RLS на webhook_bins/webhook_requests (см.
// supabase/webhook-inspector-migration.sql): добавить запрос можно
// только в конкретный бин по точному совпадению slug, через SECURITY
// DEFINER функцию ingest_webhook_request(), а не произвольной записью
// в таблицы.
export const runtime = "nodejs";

// Обрезаем то, что реально может прилететь огромным (большое тело
// запроса, гигантский заголовок вроде Cookie) — до разумного предела
// для инструмента отладки, не продакшен-приёмника трафика. Полноценного
// rate-limit'а тут нет (см. комментарий в самой миграции), это —
// вторая линия защиты по размеру одной записи, а не по частоте.
const MAX_BODY_CHARS = 20_000;
const MAX_HEADER_VALUE_CHARS = 2_000;

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

interface RouteParams {
  params: { slug: string; path?: string[] };
}

async function handle(req: NextRequest, { params }: RouteParams) {
  const slug = params.slug;
  const path = "/" + (params.path ?? []).join("/");
  const method = req.method.toUpperCase();

  const query: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((value, key) => { query[key] = value; });

  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => { headers[key] = truncate(value, MAX_HEADER_VALUE_CHARS); });

  const rawBody = await req.text().catch(() => "");
  const body = truncate(rawBody, MAX_BODY_CHARS);

  const contentType = req.headers.get("content-type");
  // Vercel проставляет реальный адрес клиента первым в списке — сам
  // заголовок может содержать цепочку через запятую (клиент, затем
  // промежуточные прокси).
  const sourceIp = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || null;

  const supabase = createServerSupabaseClient();

  let found = false;
  try {
    const { data, error } = await supabase.rpc("ingest_webhook_request", {
      p_slug: slug,
      p_method: method,
      p_path: path,
      p_query: query,
      p_headers: headers,
      p_body: body,
      p_content_type: contentType,
      p_source_ip: sourceIp,
    });
    if (error) throw error;
    found = Boolean(data);
  } catch {
    // .rpc() отсутствует у заглушки createServerSupabaseClient(), которая
    // отдаётся, когда переменные окружения Supabase не заданы (см.
    // lib/supabase/server.ts) — в такой среде Webhook Inspector
    // недоступен целиком, и это стоит сказать прямо, а не падать 500-й.
    return NextResponse.json(
      { error: "Webhook inspector service is not configured in this environment." },
      { status: 503 }
    );
  }

  if (!found) {
    return NextResponse.json(
      {
        error: "No Webhook Inspector bin found for this URL.",
        hint: "Check the URL matches exactly what /webhook-inspector gave you, including the slug.",
      },
      { status: 404 }
    );
  }

  // 200 с коротким подтверждением — большинство сервисов, шлющих
  // вебхуки, ждут именно 2xx, иначе начинают ретраить доставку. Это
  // инструмент отладки/инспекции, а не продакшен-обработчик, поэтому
  // тело ответа всегда одно и то же, независимо от метода/пути.
  return NextResponse.json({ received: true }, { status: 200 });
}

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE };
