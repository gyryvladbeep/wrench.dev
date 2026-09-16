import { createClient } from "@supabase/supabase-js";

// Клиент без cookies() из next/headers — специально для анонимных,
// закэшируемых чтений на статических/ISR-страницах (например, публичная
// агрегированная статистика на главной). createServerSupabaseClient()
// (lib/supabase/server.ts) читает cookies() ради пользовательской сессии —
// это Dynamic API, которое само по себе переводит роут на server-side
// рендер при КАЖДОМ запросе и ломает revalidate/ISR (та же причина, по
// которой app/layout.tsx НЕ читает заголовок локали через headers() —
// см. комментарий там же). Здесь сессия не нужна вообще: запрос анонимный
// и одинаковый для всех посетителей, поэтому — голый @supabase/supabase-js
// без cookie-адаптера, который ISR не трогает.
export function createPublicSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
