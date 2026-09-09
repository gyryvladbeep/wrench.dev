import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * ═══════════════════════════════════════════════════════════════
 * Service-role клиент — ТОЛЬКО для серверных admin-операций
 * ═══════════════════════════════════════════════════════════════
 * До этого файла service_role ключ Supabase использовался ровно в
 * одном месте во всём репозитории — tests/support/supabaseAdmin.ts,
 * и только тестами (см. заголовок того файла). Этот файл — первое
 * место, где service-role ключ нужен самому приложению, а не тестам:
 * auth.admin.deleteUser() — единственный способ по-настоящему удалить
 * пользователя из auth.users, и он, как и любая admin-операция,
 * работает только в обход RLS через service_role ключ. Анонимный
 * ключ (тот, что используется везде в lib/supabase/client.ts и
 * lib/supabase/server.ts) на это в принципе не способен.
 *
 * Используется сейчас только в app/api/account/delete/route.ts —
 * НЕ импортируй этот файл ни в один клиентский ("use client") файл
 * и ни в один компонент, который может оказаться в бандле браузера:
 * ключ должен жить только на сервере.
 *
 * Нужна переменная окружения SUPABASE_SERVICE_ROLE_KEY:
 *  - Локально: строка в .env.local (см. .env.local.example — там
 *    она уже описана, потому что нужна и tests/workbench-pro.spec.ts).
 *    Next.js сам подхватывает .env.local для процесса `next dev` /
 *    `next start` — отдельный ручной парсер, как в
 *    tests/support/supabaseAdmin.ts (тот файл — обычный Node-скрипт
 *    Playwright, а не часть Next.js-процесса, поэтому там он нужен),
 *    здесь не требуется.
 *  - На Vercel: Project Settings → Environment Variables. Без этого
 *    удаление аккаунта на проде будет падать с 500 — см. комментарий
 *    в app/api/account/delete/route.ts.
 */

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set — see the comment at the top of lib/supabase/admin.ts"
    );
  }

  if (!adminClient) {
    adminClient = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return adminClient;
}
