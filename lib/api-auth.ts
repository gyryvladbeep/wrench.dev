import { createHash } from "crypto";
import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "./supabase/admin";
import { API_TOKEN_PREFIX } from "./api-token-crypto";

// ═══════════════════════════════════════════════════════════════
// Проверка личного токена доступа (Authorization: Bearer <token>) для
// write-эндпоинтов публичного API (app/api/v1/mock-endpoints,
// app/api/v1/webhook-bins) — единственное место в приложении, где
// запрос от лица конкретного пользователя приходит БЕЗ Supabase-сессии
// (ни cookie, ни localStorage-токена auth.users, только сырая строка).
// Поэтому проверка идёт через service-role клиент (getSupabaseAdmin(),
// lib/supabase/admin.ts) в обход RLS api_tokens — обычный
// authenticated-клиент в принципе не может прочитать чужую (то есть
// вообще любую при анонимном запросе) строку api_tokens, чтобы найти
// владельца по хэшу.
//
// Хэш — SHA-256 через встроенный Node crypto (не Web Crypto/
// crypto.subtle): роут гарантированно исполняется в Node-рантайме
// (export const runtime = "nodejs" в каждом вызывающем файле), а
// crypto.subtle требует secure context и по-другому доступен между
// версиями Node — createHash() однозначен и не зависит от версии.
// Должен давать РОВНО тот же hex, что генерирует браузер при создании
// токена (см. hashApiTokenBrowser() в lib/api-token-crypto.ts) —
// иначе только что созданный токен никогда бы не прошёл эту проверку.
export function hashApiToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type ApiAuthResult =
  | { ok: true; userId: string }
  | { ok: false; status: number; error: string };

export async function authenticateApiRequest(req: NextRequest): Promise<ApiAuthResult> {
  const authHeader = req.headers.get("authorization") ?? "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return { ok: false, status: 401, error: "Missing Authorization: Bearer <token> header." };
  }
  const token = match[1].trim();
  if (!token.startsWith(API_TOKEN_PREFIX)) {
    return { ok: false, status: 401, error: "Invalid API token." };
  }

  let admin;
  try {
    admin = getSupabaseAdmin();
  } catch {
    // SUPABASE_SERVICE_ROLE_KEY не настроен в этом окружении — тот же
    // случай, что уже описан в комментарии app/api/account/delete/route.ts:
    // не должны падать неотловленным исключением (500 без тела), а
    // сказать прямо, что это конфигурация сервера, а не токена клиента.
    return { ok: false, status: 500, error: "API token auth is not configured on this server." };
  }

  const { data, error } = await admin
    .from("api_tokens")
    .select("id, user_id, revoked_at")
    .eq("token_hash", hashApiToken(token))
    .maybeSingle();

  if (error || !data || data.revoked_at) {
    return { ok: false, status: 401, error: "Invalid or revoked API token." };
  }

  // Синхронно, не fire-and-forget — serverless-функция может
  // завершиться сразу после отправки ответа, необновлённый
  // last_used_at был бы тихой потерей данных, а не просто задержкой.
  await admin.from("api_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);

  return { ok: true, userId: data.user_id };
}
