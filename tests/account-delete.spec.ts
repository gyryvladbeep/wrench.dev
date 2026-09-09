import { test, expect, Page, Locator } from "@playwright/test";
import { SignupPage } from "./pages/SignupPage";
import { LoginPage } from "./pages/LoginPage";

/**
 * ═══════════════════════════════════════════════════════════════
 * УДАЛЕНИЕ АККАУНТА — /profile → Settings → Danger zone
 * ═══════════════════════════════════════════════════════════════
 * Отдельный файл, а не дописано в auth-flow.spec.ts — тот про
 * жизненный цикл сессии (регистрация/вход/выход), этот — про сам
 * необратимый API-вызов удаления и его UI-подтверждение.
 *
 * Тест сам создаёт себе аккаунт (email вида
 * account-delete-test-<timestamp>-<random>@wrench-test.dev) и сам же
 * его удаляет через проверяемую фичу — значит он не зависит от
 * SUPABASE_SERVICE_ROLE_KEY и не нуждается в глобальной очистке
 * (tests/global-teardown.ts, admin-ключ) для уборки за собой: если
 * тест реально прошёл, аккаунта уже не существует. Единственный
 * способ проверить это по-настоящему — не остановиться на "форма
 * показала успех", а после удаления попытаться ВОЙТИ тем же
 * email/паролем и убедиться, что вход отклонён: только это доказывает,
 * что supabase.auth.admin.deleteUser() действительно отработал на
 * сервере, а не что клиент просто вышел из сессии локально.
 */

function uniqueTestEmail(): string {
  return `account-delete-test-${Date.now()}-${Math.floor(Math.random() * 100000)}@wrench-test.dev`;
}

const PASSWORD = "TestPassword123!";

async function openAccountMenu(page: Page): Promise<void> {
  await page.getByRole("banner").getByRole("button", { name: "Account menu" }).click();
}

async function waitForAuthOutcome(
  page: Page,
  errorLocator: Locator,
  successUrlPattern: RegExp | ((url: URL) => boolean),
  contextLabel: string
): Promise<void> {
  const outcome = await Promise.race([
    errorLocator.waitFor({ state: "visible", timeout: 15_000 }).then(() => "error" as const),
    page.waitForURL(successUrlPattern, { timeout: 15_000 }).then(() => "redirected" as const),
  ]).catch(() => "timeout" as const);

  if (outcome === "error") {
    const errorText = (await errorLocator.textContent())?.trim() ?? "(empty error text)";
    throw new Error(`${contextLabel}: server returned an error instead of success — "${errorText}"`);
  }
  if (outcome === "timeout") {
    throw new Error(`${contextLabel}: neither an error nor a redirect appeared within 15s.`);
  }
}

test.describe.serial("Удаление аккаунта", () => {
  let page: Page;
  const email = uniqueTestEmail();

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("подготовка — регистрация тестового аккаунта", async () => {
    const signup = new SignupPage(page);
    await signup.goto();
    await signup.fillForm(email, PASSWORD);
    await signup.submit();

    await waitForAuthOutcome(
      page,
      signup.errorMessage,
      (url) => url.pathname === "/" || url.pathname === "/en",
      "Регистрация тестового аккаунта"
    );
  });

  test("на вкладке Settings есть карточка «Delete account», кнопка удаления скрыта до подтверждения", async () => {
    await page.goto("/en/profile");
    await page.getByRole("button", { name: "Settings", exact: true }).click();

    await expect(page.getByRole("heading", { name: "Delete account" })).toBeVisible();
    // Пока не нажали "Delete account" — кнопки "Permanently delete" и
    // поля ввода фразы-подтверждения быть не должно.
    await expect(page.getByRole("button", { name: "Permanently delete" })).not.toBeVisible();
    await expect(page.locator("#delete-confirm-input")).not.toBeVisible();
  });

  test("кнопка «Permanently delete» остаётся disabled, пока фраза не введена правильно", async () => {
    await page.getByRole("button", { name: "Delete account", exact: true }).click();

    const confirmInput  = page.locator("#delete-confirm-input");
    const confirmButton = page.getByRole("button", { name: "Permanently delete" });

    await expect(confirmInput).toBeVisible();
    await expect(confirmButton).toBeDisabled();

    await confirmInput.fill("DEL"); // неполная фраза
    await expect(confirmButton).toBeDisabled();

    await confirmInput.fill("DELETE ME"); // похоже, но не совпадает
    await expect(confirmButton).toBeDisabled();

    await confirmInput.fill(""); // снова пусто
    await expect(confirmButton).toBeDisabled();

    // Регистр не имеет значения — это текстовая защита от случайного
    // клика, а не проверка чувствительных данных (см. .toUpperCase() в
    // handleDeleteAccount на /profile), так что "delete" тоже включает
    // кнопку. Возвращаем поле в пустое состояние перед следующим тестом.
    await confirmInput.fill("delete");
    await expect(confirmButton).toBeEnabled();
    await confirmInput.fill("");
    await expect(confirmButton).toBeDisabled();
  });

  test("«Cancel» закрывает подтверждение и сбрасывает введённый текст", async () => {
    await page.locator("#delete-confirm-input").fill("something");
    await page.getByRole("button", { name: "Cancel", exact: true }).click();

    await expect(page.locator("#delete-confirm-input")).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Delete account", exact: true })).toBeVisible();

    // Открываем заново — поле должно быть пустым, а не хранить "something".
    await page.getByRole("button", { name: "Delete account", exact: true }).click();
    await expect(page.locator("#delete-confirm-input")).toHaveValue("");
  });

  test("подтверждение удаления переживает переключение вкладок (сбрасывается, а не зависает)", async () => {
    // Тот же класс бага, что уже чинили для confirmDeleteId в Workbench
    // (workbench/page.tsx) — открыли подтверждение, ушли на другую
    // вкладку и вернулись: подтверждение не должно остаться открытым.
    await page.locator("#delete-confirm-input").fill("DELETE");
    await page.getByRole("button", { name: "Overview", exact: true }).click();
    await page.getByRole("button", { name: "Settings", exact: true }).click();

    await expect(page.locator("#delete-confirm-input")).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Delete account", exact: true })).toBeVisible();
  });

  test("ввод правильной фразы и клик «Permanently delete» удаляет аккаунт и возвращает на главную разлогиненным", async () => {
    await page.getByRole("button", { name: "Delete account", exact: true }).click();
    await page.locator("#delete-confirm-input").fill("DELETE");

    const confirmButton = page.getByRole("button", { name: "Permanently delete" });
    await expect(confirmButton).toBeEnabled();
    await confirmButton.click();

    await page.waitForURL((url) => url.pathname === "/" || url.pathname === "/en", { timeout: 15_000 });
    await expect(page.getByRole("link", { name: "Sign in", exact: true })).toBeVisible();
  });

  test("после удаления вход тем же email/паролем отклоняется — аккаунт действительно удалён на сервере", async () => {
    const login = new LoginPage(page);
    await login.goto();
    await login.fillForm(email, PASSWORD);
    await login.submit();

    await expect(login.errorMessage).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
