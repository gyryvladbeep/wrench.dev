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

// Realtime-клиент supabase-js создаётся вместе с обычным и на Node < 22
// падает ещё в createClient ("native WebSocket not found") — на CI Node 20.
// Этому клиенту realtime не нужен вообще (только Admin API и REST), поэтому
// отдаём заглушку вместо настоящего WebSocket: соединение всё равно ни разу
// не открывается.
class NoRealtimeWebSocket {
  constructor() {
    throw new Error("Realtime не используется админ-клиентом");
  }
}

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
      realtime: { transport: NoRealtimeWebSocket as never },
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
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
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
 * Собирает все аккаунты, чей email проходит проверку predicate, — все
 * страницы целиком, и только ПОТОМ вызывающий код что-то удаляет.
 *
 * Раньше deleteTestAccounts удалял аккаунты прямо во время постраничного
 * обхода, а это ломает сам обход: после удаления части пользователей с
 * первой страницы все остальные сдвигаются вверх, и запрос "страница 2"
 * перепрыгивает через тех, кто сдвинулся на страницу 1. Часть тестовых
 * аккаунтов оставалась нетронутой при каждом прогоне и копилась в
 * проекте от запуска к запуску.
 */
async function listUsersMatching(
  predicate: (lowerCaseEmail: string) => boolean
): Promise<{ id: string; email: string }[]> {
  const admin = getAdminClient();
  const perPage = 200;
  const found: { id: string; email: string }[] = [];

  for (let page = 1; page <= 100; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    for (const u of data.users) {
      if (u.email && predicate(u.email.toLowerCase())) {
        found.push({ id: u.id, email: u.email });
      }
    }

    if (data.users.length < perPage) break; // последняя страница
  }

  return found;
}

/**
 * Удаляет одного пользователя, до 3 попыток с короткой паузой —
 * Admin API изредка отвечает временной ошибкой под нагрузкой (например,
 * сразу после регистрации, пока триггеры на auth.users ещё доделывают
 * свою работу). Возвращает null при успехе (в том числе если аккаунта
 * уже нет — цель "аккаунта нет в базе" достигнута) или текст последней
 * ошибки, если все попытки провалились.
 */
async function deleteUserWithRetry(id: string): Promise<string | null> {
  const admin = getAdminClient();
  let lastMessage = "unknown error";

  for (let attempt = 1; attempt <= 3; attempt++) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (!error) return null;

    const status = (error as { status?: number }).status;
    if (status === 404 || /not found/i.test(error.message)) return null;

    lastMessage = error.message;
    await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
  }

  return lastMessage;
}

/**
 * Удаляет ВСЕ аккаунты, чей email заканчивается на переданный
 * суффикс (например "@wrench-test.dev") — используется в
 * tests/global-teardown.ts как страховочная сетка: основная очистка
 * делается сразу после каждого тестового файла (см.
 * cleanupTestAccount ниже), а эта функция добирает то, что могло
 * остаться (прогон оборвали на середине, afterAll не успел
 * отработать, аккаунты остались от старых прогонов).
 *
 * Один неудачный вызов не останавливает обработку остальных.
 */
export async function deleteTestAccounts(emailSuffix: string): Promise<{ deleted: number; failed: number }> {
  const suffix = emailSuffix.toLowerCase();
  const matches = await listUsersMatching((email) => email.endsWith(suffix));

  let deleted = 0;
  let failed = 0;
  for (const u of matches) {
    const failure = await deleteUserWithRetry(u.id);
    if (failure) {
      failed++;
      console.error(`[deleteTestAccounts] failed to delete ${u.email}: ${failure}`);
    } else {
      deleted++;
    }
  }

  return { deleted, failed };
}

/**
 * Удаляет один аккаунт по точному email. Возвращает true, если аккаунт
 * был найден и удалён, и false, если такого аккаунта уже нет (например,
 * его удалил сам тест через кнопку "Delete account" в приложении —
 * см. account-delete.spec.ts — это нормальный исход, а не ошибка).
 * Бросает исключение, если удалить не удалось — для вызова из afterAll
 * используй cleanupTestAccount ниже, он исключений не бросает.
 */
export async function deleteAccountByEmail(email: string): Promise<boolean> {
  const target = email.toLowerCase();
  const matches = await listUsersMatching((e) => e === target);
  if (matches.length === 0) return false;

  for (const u of matches) {
    const failure = await deleteUserWithRetry(u.id);
    if (failure) throw new Error(`не удалось удалить ${u.email}: ${failure}`);
  }
  return true;
}

let warnedNoKey = false;

/**
 * Очистка за одним тестовым аккаунтом — вызывается из test.afterAll
 * каждого spec-файла, который регистрирует настоящего пользователя в
 * Supabase (auth-flow, workbench, workbench-pro, mock-api-import,
 * account-delete).
 *
 * Никогда не бросает исключений: сами тесты к этому моменту уже
 * прошли или упали, и неудачная уборка не должна превращать зелёный
 * прогон в красный. Неудачу (и отсутствие ключа) она громко пишет в
 * лог, а то, что осталось, добирает tests/global-teardown.ts.
 */
export async function cleanupTestAccount(email: string | undefined): Promise<void> {
  if (!email) return; // тест не дошёл до регистрации (например, был скипнут)

  if (!hasServiceRoleKey) {
    if (!warnedNoKey) {
      warnedNoKey = true;
      console.warn(
        "[cleanupTestAccount] SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL не заданы — " +
        "тестовые аккаунты НЕ удаляются и останутся в Supabase (см. шапку tests/support/supabaseAdmin.ts)."
      );
    }
    return;
  }

  try {
    const deleted = await deleteAccountByEmail(email);
    console.log(`[cleanupTestAccount] ${email}: ${deleted ? "deleted" : "already gone"}`);
  } catch (err) {
    console.error(`[cleanupTestAccount] ${email}: cleanup failed —`, err);
  }
}
