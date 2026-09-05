import { test, expect } from "@playwright/test";
import { SignupPage } from "./pages/SignupPage";

/**
 * ═══════════════════════════════════════════════════════════════
 * Регистрация — валидация полей (без обращения к сети)
 * ═══════════════════════════════════════════════════════════════
 * Этот файл специально ограничен тем, что можно проверить БЕЗ живого
 * запроса к Supabase — чисто клиентской валидацией формы. Реальный
 * сетевой сценарий (успешная регистрация, дубликат email, вход, выход,
 * персист сессии) переехал в tests/auth-flow.spec.ts — там же лежит
 * подробное объяснение, почему это разделено на два файла, и что
 * делать, если тот файл падает с упоминанием captcha.
 *
 * Раньше два сетевых теста лежали прямо здесь под test.skip() с
 * пометкой "заблокировано hCaptcha" — то есть предполагалось, что
 * попытка провалится, и тест даже не пытался её сделать. Теперь мы это
 * предположение реально проверяем в auth-flow.spec.ts, поэтому здесь
 * дублирующие skip-заглушки убраны.
 */

function uniqueTestEmail(): string {
  return `qa-test-${Date.now()}@wrench-test.dev`;
}

test.describe("Регистрация — валидация", () => {

  test("несовпадающие пароли показывают ошибку и НЕ отправляют форму", async ({ page }) => {
    const signup = new SignupPage(page);
    await signup.goto();

    const email = uniqueTestEmail();
    await signup.fillForm(email, "Password123!", "DifferentPassword456!");
    await signup.submit();

    // Проверяем что ошибка появилась
    await expect(signup.errorMessage).toBeVisible();

    // ─────────────────────────────────────────────────────────
    // УРОК: проверяем ОТСУТСТВИЕ побочного эффекта
    // ─────────────────────────────────────────────────────────
    // Важно убедиться, что URL НЕ поменялся — то есть форма
    // реально не отправилась на сервер и пользователь не был создан.
    // Если бы мы проверили только "ошибка видна" — тест прошёл бы,
    // даже если бы приложение по ошибке всё равно создало аккаунт
    // и просто показало лишнее сообщение поверх.
    await expect(page).toHaveURL(/\/auth\/signup/);
  });

  test("пароль короче 8 символов не проходит валидацию браузера", async ({ page }) => {
    const signup = new SignupPage(page);
    await signup.goto();

    await signup.fillForm(uniqueTestEmail(), "short");

    // ─────────────────────────────────────────────────────────
    // УРОК: тестируем HTML5-валидацию браузера, а не только
    // логику JavaScript. У поля password есть атрибут minLength={8}
    // — это заставляет САМ БРАУЗЕР блокировать отправку формы,
    // даже до того как сработает наш JS-код. Проверяем именно это.
    // ─────────────────────────────────────────────────────────
    const isValid = await signup.passwordInput.evaluate(
      (el: HTMLInputElement) => el.checkValidity()
    );
    expect(isValid).toBe(false);
  });

  test("email без @ не проходит валидацию браузера", async ({ page }) => {
    const signup = new SignupPage(page);
    await signup.goto();

    // Поле email имеет type="email" — браузер сам отклоняет строки без
    // "@домена", это встроенная HTML5-валидация, не наш JS-код.
    await signup.fillForm("not-an-email", "ValidPassword123!");

    const isValid = await signup.emailInput.evaluate(
      (el: HTMLInputElement) => el.checkValidity()
    );
    expect(isValid).toBe(false);
  });

  test("пустая форма блокируется валидацией браузера (все три поля required)", async ({ page }) => {
    const signup = new SignupPage(page);
    await signup.goto();

    const emailValid    = await signup.emailInput.evaluate((el: HTMLInputElement) => el.checkValidity());
    const passwordValid = await signup.passwordInput.evaluate((el: HTMLInputElement) => el.checkValidity());
    const confirmValid  = await signup.confirmInput.evaluate((el: HTMLInputElement) => el.checkValidity());

    expect(emailValid).toBe(false);
    expect(passwordValid).toBe(false);
    expect(confirmValid).toBe(false);
  });

});