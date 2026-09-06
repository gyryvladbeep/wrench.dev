import fs from "fs";
import path from "path";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * ═══════════════════════════════════════════════════════════════
 * Админ-доступ к Supabase — ТОЛЬКО для самих тестов
 * ═══════════════════════════════════════════════════════════════
 * Реордер вкладок рабочих столов (workbench-pro.spec.ts) — фича
 * Pro-тарифа: free-аккаунт получает всего 1 рабочий стол, тащить
 * там нечего (см. FREE_MAX_WORKBENCHES в useWorkbenches.ts). Обычная
 * регистрация даёт free — единственный способ по-настоящему
 * проверить перетаскивание вкладок сценарием, близким к боевому, —
 * выдать тестовому аккаунту Pro напрямую в базе, в обход Stripe.
 *
 * Это делается service_role ключом Supabase (он обходит RLS) —
 * приложение само НИКОГДА его не использует, ни на клиенте, ни на
 * сервере (см. lib/supabase/client.ts — там только анонимный ключ).
 * Ключ нужен только этому файлу и только при локальном запуске
 * тестов.
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
