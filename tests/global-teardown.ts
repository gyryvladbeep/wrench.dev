import { hasServiceRoleKey, deleteTestAccounts } from "./support/supabaseAdmin";

/**
 * ═══════════════════════════════════════════════════════════════
 * globalTeardown — страховочная сетка для тестовых аккаунтов
 * ═══════════════════════════════════════════════════════════════
 * Основная очистка происходит сразу после каждого тестового файла:
 * auth-flow, workbench, workbench-pro, mock-api-import и account-delete
 * регистрируют настоящие аккаунты в Supabase (email вида
 * qa-test-..., wb-test-..., wb-pro-test-..., mockapi-test-...,
 * account-delete-test-... @wrench-test.dev) и сами удаляют их в
 * test.afterAll через cleanupTestAccount() — см.
 * tests/support/supabaseAdmin.ts.
 *
 * Этот файл Playwright запускает один раз, когда ВСЕ тесты закончили, и
 * добирает то, что afterAll не смог удалить: прогон оборвали на
 * середине (Ctrl+C, таймаут CI), удаление временно не прошло, или
 * аккаунты остались от старых прогонов, сделанных до появления
 * очистки в самих тестах.
 *
 * Требует SUPABASE_SERVICE_ROLE_KEY и NEXT_PUBLIC_SUPABASE_URL (см.
 * .env.local.example и .github/workflows/playwright.yml) — без них
 * аккуратно ничего не делает и не роняет прогон, но громко пишет об
 * этом в лог.
 */
export default async function globalTeardown() {
  if (!hasServiceRoleKey) {
    console.warn(
      "[global-teardown] SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL not set — " +
      "skipping test account cleanup, accounts @wrench-test.dev will stay in Supabase"
    );
    return;
  }

  try {
    const { deleted, failed } = await deleteTestAccounts("@wrench-test.dev");
    console.log(`[global-teardown] cleaned up ${deleted} leftover test account(s)${failed ? `, ${failed} failed to delete` : ""}`);
  } catch (err) {
    // Никогда не роняем весь прогон тестов из-за неудачной уборки —
    // сами тесты уже прошли (или не прошли) независимо от этого шага.
    console.error("[global-teardown] test account cleanup failed:", err);
  }
}
