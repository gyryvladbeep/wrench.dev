import { hasServiceRoleKey, deleteTestAccounts } from "./support/supabaseAdmin";

/**
 * ═══════════════════════════════════════════════════════════════
 * globalTeardown — подчищает тестовые аккаунты после ВСЕГО прогона
 * ═══════════════════════════════════════════════════════════════
 * auth-flow.spec.ts, workbench.spec.ts и workbench-pro.spec.ts
 * регистрируют настоящие аккаунты в Supabase на каждый прогон (email
 * вида qa-test-<timestamp>-<random>@wrench-test.dev, wb-test-... и
 * wb-pro-test-...) — без очистки они бы копились в проекте вечно.
 *
 * Playwright запускает этот файл ровно один раз, уже после того как
 * ВСЕ тесты (во всех файлах, во всех воркерах) закончили работу — это
 * единственное надёжное место для такой очистки, а не внутри каждого
 * spec-файла по отдельности (иначе пришлось бы дублировать эту логику
 * в трёх местах и держать её в синхронизации).
 *
 * Требует SUPABASE_SERVICE_ROLE_KEY (см. .env.local.example и
 * .github/workflows/playwright.yml) — без него аккуратно ничего не
 * делает и не роняет прогон, точно так же как self-skip в
 * workbench-pro.spec.ts.
 */
export default async function globalTeardown() {
  if (!hasServiceRoleKey) {
    console.log("[global-teardown] SUPABASE_SERVICE_ROLE_KEY not set — skipping test account cleanup");
    return;
  }

  try {
    const { deleted, failed } = await deleteTestAccounts("@wrench-test.dev");
    console.log(`[global-teardown] cleaned up ${deleted} test account(s)${failed ? `, ${failed} failed to delete` : ""}`);
  } catch (err) {
    // Никогда не роняем весь прогон тестов из-за неудачной уборки —
    // сами тесты уже прошли (или не прошли) независимо от этого шага.
    console.error("[global-teardown] test account cleanup failed:", err);
  }
}
