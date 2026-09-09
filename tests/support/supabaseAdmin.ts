import fs from "fs";
import path from "path";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * ═══════════════════════════════════════════════════════════════
 * Админ-доступ к Supabase — для тестов
 * ═══════════════════════════════════════════════════════════════
 * Два независимых применения:
 *  1. Реордер вкладок рабочих столов (workbench-pro.spec.ts) — фича
 *     Pro-тарифа: free-аккаунт получает всего 1 рабочий стол, тащить
 *     там нечего (см. FREE_MAX_WORKBENCHES в useWorkbenches.ts). Обычная
 *     регистрация даёт free — единственный способ по-настоящему
 *     проверить перетаскивание вкладок сценарием, близким к боевому, —
 *     выдать тестовому аккаунту Pro напрямую в базе, в обход Stripe.
 *  2. Очистка тестовых аккаунтов после прогона всего набора тестов
 *     (tests/global-teardown.ts, см. deleteTestAccounts ниже) —
 *     auth-flow.spec.ts, workbench.spec.ts и workbench-pro.spec.ts
 *     создают настоящие аккаунты в Supabase на каждый прогон, и без
 *     очистки они копились бы в проекте вечно.
 *
 * Это делается service_role ключом Supabase (он обходит RLS). Сама
 * функция удаления аккаунта в приложении (app/api/account/delete/
 * route.ts, для кнопки "Удалить аккаунт" на /profile) использует свой
 * отдельный service-role клиент — lib/supabase/admin.ts — не этот
 * файл, потому что тесты и сам Next.js-процесс живут в разных Node-
 * окружениях (см. loadEnvLocal() ниже и комментарий в lib/supabase/
 * admin.ts).
 *
 * Разворачивание:
 *  1. Supabase Dashboard → Settings → API → скопировать "service_role"
 *     ключ (это секрет, НЕ анонимный ключ — не путать).
 *  2. Добавить строку в .env.local (не в .env.local.example — тот
 *     коммитится в git):
 *       SUPABASE_SERVICE_ROLE_KEY=<вставленный ключ>
 *  3. Готово — workbench-pro.spec.ts подхватит его сам. Без этой
 *     переменной тесты в этом файле аккуратно скипаются (см.
 *     hasServiceRoleKey), а не падают.
 */

// Playwright-тесты — обычный Node-процесс, не Next.js, поэтому
// .env.local сам по себе не подхватывается (это делает только сам
// Next.js для своего собственного процесса). Пишем свой крошечный
// парсер вместо того, чтобы тянуть в зависимости целый dotenv ради
// десятка строк.
function loadEnvLocal(): Record<string, string> {
  const envPath = path.resolve(__dirname, "../../.env.local");
  const vars: Record<string, string> = {};
  if (!fs.existsSync(envPath)) return vars;
  const content = fs.readFileSync(envPath, "utf-8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

const env = { ...loadEnvLocal(), ...process.env };

const SUPABASE_URL      = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY;

/** true, если можно поднимать тестовому аккаунту Pro — используется
 *  тестами, чтобы аккуратно себя скипнуть, если ключа нет. */
export const hasServiceRoleKey = Boolean(SUPABASE_URL && SERVICE_ROLE_KEY);

let adminClient: SupabaseClient | null = null;

function getAdminClient(): SupabaseClient {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY не найден в .env.local — см. инструкцию " +
      "в шапке tests/support/supabaseAdmin.ts. Проверяй hasServiceRoleKey " +
      "перед вызовом функций этого модуля."
    );
  }
  if (!adminClient) {
    adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return adminClient;
}

/**
 * Находит id пользователя по email через Admin API (обходит RLS —
 * обычный клиент с анонимным ключом чужие email искать не может).
 * Перебираем страницы, а не полагаемся на то, что свежий тестовый
 * аккаунт окажется на первой — со временем в проекте накапливаются
 * qa-test-* / wb-test-* аккаунты из других файлов тестов.
 */
export async function findUserIdByEmail(email: string): Promise<string | null> {
  const admin = getAdminClient();
  const perPage = 200;
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = data.users.find((u) => u.email === email);
    if (found) return found.id;
    if (data.users.length < perPage) break; // последняя страница
  }
  return null;
}

/**
 * Выдаёт аккаунту Pro напрямую в таблице subscriptions — в обход
 * Stripe и RLS. Только для тестового окружения (см. заголовок файла).
 * У свежего аккаунта строки в subscriptions ещё нет (её создают
 * только вебхуки Stripe при первой оплате, см. комментарий в
 * schema.sql), поэтому вставляем новую, а не апсертим по user_id —
 * уникального индекса на user_id в схеме нет.
 */
export async function grantProPlan(userId: string): Promise<void> {
  const admin = getAdminClient();
  const { error } = await admin
    .from("subscriptions")
    .insert({ user_id: userId, plan: "pro", status: "active" });
  if (error) throw error;
}

/**
 * Удаляет ВСЕ аккаунты, чей email заканчивается на переданный
 * суффикс (например "@wrench-test.dev") — используется в
 * tests/global-teardown.ts, чтобы прогоны auth-flow.spec.ts,
 * workbench.spec.ts и workbench-pro.spec.ts (каждый создаёт
 * настоящий аккаунт в Supabase на каждый прогон) не копили мусор
 * в боевом проекте вечно.
 *
 * Каждый аккаунт удаляется отдельным вызовом, и один неудачный
 * вызов не останавливает обработку остальных — например, если
 * аккаунт уже был удалён (свежедобавленная фича удаления аккаунта
 * из самого приложения могла успеть удалить его раньше нас) между
 * листингом и удалением.
 */
export async function deleteTestAccounts(emailSuffix: string): Promise<{ deleted: number; failed: number }> {
  const admin = getAdminClient();
  const perPage = 200;
  let deleted = 0;
  let failed = 0;

  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const matches = data.users.filter((u) => u.email?.toLowerCase().endsWith(emailSuffix.toLowerCase()));
    for (const u of matches) {
      const { error: delError } = await admin.auth.admin.deleteUser(u.id);
      if (delError) {
        failed++;
        console.error(`[deleteTestAccounts] failed to delete ${u.email}:`, delError.message);
      } else {
        deleted++;
      }
    }

    if (data.users.length < perPage) break; // последняя страница
  }

  return { deleted, failed };
}
