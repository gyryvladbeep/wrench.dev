import { test, expect, Page } from "@playwright/test";
import { SignupPage } from "./pages/SignupPage";
import { WorkbenchPage } from "./pages/WorkbenchPage";
import { hasServiceRoleKey, findUserIdByEmail, grantProPlan } from "./support/supabaseAdmin";

/**
 * ═══════════════════════════════════════════════════════════════
 * WORKBENCH (Pro): реордер вкладок рабочих столов
 * ═══════════════════════════════════════════════════════════════
 * Отдельный файл, а не часть workbench.spec.ts, по одной причине:
 * free-тариф даёт всего 1 рабочий стол (см. FREE_MAX_WORKBENCHES в
 * useWorkbenches.ts) — перетаскивать вкладки местами просто не из
 * чего, пока их не несколько. Единственный способ добраться до Pro
 * в тесте — выдать аккаунту Pro напрямую в базе через service_role
 * ключ, в обход Stripe (см. tests/support/supabaseAdmin.ts — там же
 * инструкция, как его завести).
 *
 * Без SUPABASE_SERVICE_ROLE_KEY в .env.local этот файл аккуратно
 * скипается целиком (test.skip в beforeAll) — прогон без ключа
 * не должен падать, только явно сообщить, что часть покрытия сейчас
 * недоступна.
 *
 * ПОБОЧНЫЙ ЭФФЕКТ: создаёт одного реального пользователя в боевой базе
 * (email вида wb-pro-test-<timestamp>@wrench-test.dev) с настоящей
 * Pro-записью в subscriptions — чисти вместе с qa-test-* / wb-test-* в
 * Supabase Dashboard → Authentication → Users (и строку в таблице
 * subscriptions заодно).
 */

function uniqueTestEmail(): string {
  return `wb-pro-test-${Date.now()}-${Math.floor(Math.random() * 100000)}@wrench-test.dev`;
}

const PASSWORD = "TestPassword123!";

test.describe.serial("Workbench (Pro): реордер вкладок рабочих столов", () => {
  let page: Page;
  let wb: WorkbenchPage;

  test.beforeAll(async ({ browser }) => {
    test.skip(
      !hasServiceRoleKey,
      "SUPABASE_SERVICE_ROLE_KEY не задан в .env.local — без него тест не может выдать " +
      "тестовому аккаунту Pro в обход Stripe. См. инструкцию в шапке tests/support/supabaseAdmin.ts."
    );

    page = await browser.newPage();
    const email = uniqueTestEmail();
    const signup = new SignupPage(page);
    await signup.goto();
    await signup.fillForm(email, PASSWORD);
    await signup.submit();
    // Та же логика, что и в workbench.spec.ts — успешная регистрация
    // ведёт на главную, /workbench открываем отдельным переходом.
    await page.waitForURL((url) => url.pathname === "/" || url.pathname === "/en", { timeout: 15_000 });

    const userId = await findUserIdByEmail(email);
    if (!userId) {
      throw new Error(`Не удалось найти только что созданного пользователя ${email} через Admin API`);
    }
    await grantProPlan(userId);

    // useSubscription() читает subscriptions один раз при монтировании
    // компонента, а строку в базе мы вставили уже ПОСЛЕ того, как
    // текущая страница смонтировалась — открываем /workbench свежим
    // переходом, а не полагаемся на реактивность уже смонтированного
    // хука (его для этого никто не звал).
    wb = new WorkbenchPage(page);
    await wb.goto();
  });

  test.afterAll(async () => {
    await page?.close();
  });

  test("Pro-аккаунту доступно больше одного рабочего стола", async () => {
    // Тот же баннер лимита, что free-тариф видит вместо кнопки
    // создания (см. workbench.spec.ts) — здесь его быть не должно.
    await expect(wb.newWorkspaceButton).toBeVisible();
    await expect(wb.limitWorkspacesText).toBeHidden();
  });

  test("перетаскивание вкладки рабочего стола меняет их порядок и сохраняется после перезагрузки", async () => {
    // Дефолтный рабочий стол новой регистрации всегда называется
    // "My Workbench" (см. useWorkbenches.ts) — сразу переименовываем,
    // чтобы у всех трёх вкладок ниже были свои уникальные имена.
    await wb.renameActiveWorkspace("My Workbench", "Alpha");

    await wb.newWorkspaceButton.click();
    await expect(wb.workspaceTab("New workspace")).toBeVisible();
    await wb.renameActiveWorkspace("New workspace", "Beta");

    await wb.newWorkspaceButton.click();
    await expect(wb.workspaceTab("New workspace")).toBeVisible();
    await wb.renameActiveWorkspace("New workspace", "Gamma");

    const before = await wb.workspaceTabOrder();
    expect(before).toEqual(["Alpha", "Beta", "Gamma"]);

    // Перетаскиваем первую вкладку на место последней — тот же приём,
    // что и для карточек инструментов в workbench.spec.ts.
    await wb.dragWorkspaceTabOnto("Alpha", "Gamma");
    const after = await wb.workspaceTabOrder();

    expect(after).not.toEqual(before);
    expect([...after].sort()).toEqual([...before].sort()); // тот же набор, другой порядок

    // Новый порядок пишется в position в базе (reorderWorkbenches), а
    // не только в локальный state компонента — перезагрузка страницы
    // должна вернуть именно этот порядок, если сохранение реально
    // сработало, а не просто перерисовало те же карточки на клиенте.
    await page.reload();
    await expect(wb.workspaceTab(after[0])).toBeVisible();
    const orderAfterReload = await wb.workspaceTabOrder();
    expect(orderAfterReload).toEqual(after);
  });
});
