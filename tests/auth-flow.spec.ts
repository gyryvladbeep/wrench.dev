import { test, expect, Page, Locator } from "@playwright/test";
import { SignupPage } from "./pages/SignupPage";
import { LoginPage } from "./pages/LoginPage";

/**
 * ═══════════════════════════════════════════════════════════════
 * ПОЛНЫЙ ЖИЗНЕННЫЙ ЦИКЛ АККАУНТА: регистрация → вход → выход
 * ═══════════════════════════════════════════════════════════════
 *
 * ЗАЧЕМ ЭТОТ ФАЙЛ СУЩЕСТВУЕТ ОТДЕЛЬНО ОТ signup.spec.ts:
 * signup.spec.ts проверяет только то, что можно проверить БЕЗ сети —
 * валидацию полей формы. Этот файл, наоборот, специально бьёт по
 * настоящему Supabase — потому что единственный способ узнать, реально
 * ли ломается регистрация/вход, это попробовать их по-настоящему,
 * а не гадать по коду.
 *
 * ГЛАВНОЕ ОТЛИЧИЕ ОТ СТАРОЙ ВЕРСИИ ЭТОГО ТЕСТА:
 * Раньше "успешная регистрация" и "дубликат email" были помечены
 * test.skip() с комментарием "заблокировано hCaptcha" — то есть тест
 * ЗАРАНЕЕ предполагал, что попытка провалится, и даже не пытался.
 * Это было предположение, а не факт. Здесь мы это предположение
 * проверяем: пробуем по-настоящему и явно проверяем ОБА возможных
 * исхода — либо успех (редирect), либо конкретная ошибка. Если это
 * действительно капча — тест упадёт с текстом ошибки Supabase прямо
 * в выводе, и мы будем знать наверняка, а не гадать.
 *
 * ВАЖНО ПРО hCaptcha, если тест ниже упадёт с чем-то вроде
 * "captcha verification process failed" или просто "captcha":
 * Я прочитал весь код SignupForm.tsx, LoginForm.tsx и всего проекта —
 * НИГДЕ нет виджета hCaptcha и НИГДЕ не передаётся captchaToken в
 * supabase.auth.signUp()/signInWithPassword(). Единственное упоминание
 * "captcha" во всём репозитории было в комментариях старой версии этого
 * файла. Если в Supabase Dashboard → Authentication → Attack Protection
 * реально включена "Enable CAPTCHA protection" — это значит, что
 * Supabase на бэкенде ТРЕБУЕТ токен капчи, а фронтенд его физически
 * никогда не присылает. Тогда падает КАЖДАЯ попытка регистрации И входа
 * для ВСЕХ пользователей, не только для тестов — это словами "никто не
 * может зарегистрироваться". Проверяется за 30 секунд без единой
 * строчки кода: Supabase Dashboard → Authentication → Attack Protection.
 * Если галочка включена и хочешь оставить защиту от ботов — нужно
 * добавить настоящий hCaptcha-виджет на обе формы. Если защита не
 * нужна — просто выключить галочку.
 *
 * ПОБОЧНЫЙ ЭФФЕКТ, КАК И РАНЬШЕ: успешный прогон создаёт реального
 * пользователя в боевой базе Supabase (email вида
 * qa-test-<timestamp>@wrench-test.dev). Периодически подчищай их
 * вручную в Supabase Dashboard → Authentication → Users, фильтруя по
 * "wrench-test.dev".
 */

function uniqueTestEmail(): string {
  return `qa-test-${Date.now()}-${Math.floor(Math.random() * 100000)}@wrench-test.dev`;
}

const PASSWORD = "TestPassword123!";
const PASSWORD_AFTER_DUPLICATE_ATTEMPT = "AnotherPassword456!";

// Ждём один из двух возможных исходов сетевого auth-запроса и явно
// говорим, какой из них случился — вместо того чтобы просто упасть по
// таймауту, если что-то пошло не так. failMessage встраивается в текст
// ошибки, если исход — "error", чтобы причина падения теста была видна
// сразу в отчёте, без необходимости открывать трейс.
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
    const errorText = (await errorLocator.textContent())?.trim() ?? "(пустой текст ошибки)";
    const captchaHint = /captcha/i.test(errorText)
      ? "\n\n→ Текст ошибки упоминает captcha — см. комментарий в начале файла про Supabase Attack Protection."
      : "";
    throw new Error(`${contextLabel}: сервер вернул ошибку вместо успеха — "${errorText}"${captchaHint}`);
  }
  if (outcome === "timeout") {
    throw new Error(`${contextLabel}: за 15 секунд не появилась ни ошибка, ни редирект — форма могла зависнуть.`);
  }
}

test.describe.serial("Аккаунт: регистрация → сессия → выход → повторный вход → выход", () => {
  // Один page на всю serial-группу — намеренно. Нам нужно, чтобы кука
  // сессии Supabase дожила от регистрации до последующего логаута и
  // повторного входа, как это происходит у реального человека в одной
  // вкладке браузера. Если бы каждый test() получал свежий page (как
  // при обычном использовании фикстуры), сессия бы не сохранялась
  // между шагами и мы бы тестировали не то.
  let page: Page;
  const email = uniqueTestEmail();

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("шаг 1 — регистрация нового пользователя логинит его и ведёт на главную", async () => {
    const signup = new SignupPage(page);
    await signup.goto();
    await signup.fillForm(email, PASSWORD);
    await signup.submit();

    await waitForAuthOutcome(
      page,
      signup.errorMessage,
      (url) => url.pathname === "/" || url.pathname === "/en",
      "Регистрация"
    );

    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible({ timeout: 10_000 });
  });

  test("шаг 2 — сессия переживает обновление страницы (F5)", async () => {
    // Реальный человек не выходит из аккаунта каждый раз, когда
    // перезагружает вкладку — если это сломано, значит либо middleware
    // теряет куки Supabase при редиректах, либо клиент не подхватывает
    // сохранённую сессию при старте.
    await page.reload();
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible({ timeout: 10_000 });
  });

  test("шаг 3 — выход возвращает шапку в гостевое состояние", async () => {
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.waitForURL((url) => url.pathname === "/" || url.pathname === "/en", { timeout: 10_000 });

    await expect(page.getByRole("link", { name: "Sign in", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Create account" })).toBeVisible();
  });

  test("шаг 4 — после выхода /profile редиректит на страницу входа", async () => {
    // ProfilePage сама делает router.push на /auth/login, если user===null
    // после гидратации — это защита закрытого раздела, а не 404/500.
    await page.goto("/en/profile");
    await page.waitForURL(/\/auth\/login/, { timeout: 10_000 });
  });

  test("шаг 5 — вход с ПРАВИЛЬНЫМ email, но НЕВЕРНЫМ паролем показывает ошибку и не пускает", async () => {
    const login = new LoginPage(page);
    await login.goto();
    await login.fillForm(email, "TotallyWrongPassword999!");
    await login.submit();

    await expect(login.errorMessage).toBeVisible({ timeout: 15_000 });
    // Ключевая негативная проверка: убеждаемся что нас НЕ пустили внутрь.
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.getByRole("button", { name: "Sign out" })).not.toBeVisible();
  });

  test("шаг 6 — вход с правильным email и паролем логинит на /profile", async () => {
    const login = new LoginPage(page);
    // Мы всё ещё на /auth/login после шага 5 — просто переиспользуем форму,
    // а не гоняем повторный goto(), это ближе к тому, что делает живой
    // человек (исправляет пароль и жмёт кнопку ещё раз).
    await login.passwordInput.fill(PASSWORD);
    await login.submit();

    await waitForAuthOutcome(page, login.errorMessage, /\/profile/, "Повторный вход");
    await expect(page).toHaveURL(/\/profile/);
  });

  test("шаг 7 — выход после повторного входа работает так же, как и в первый раз", async () => {
    // Не самопроверка ради самопроверки: некоторые баги логаута
    // проявляются только со ВТОРОЙ сессии (например, если состояние
    // React не полностью сбрасывается между сессиями одного таба).
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.waitForURL((url) => url.pathname === "/" || url.pathname === "/en", { timeout: 10_000 });
    await expect(page.getByRole("link", { name: "Sign in", exact: true })).toBeVisible();
  });

  test("шаг 8 — повторная регистрация с тем же email отклоняется с понятной ошибкой", async () => {
    const signup = new SignupPage(page);
    await signup.goto();
    await signup.fillForm(email, PASSWORD_AFTER_DUPLICATE_ATTEMPT);
    await signup.submit();

    await expect(signup.errorMessage).toBeVisible({ timeout: 15_000 });
    // И снова: подтверждаем что дубликат НЕ залогинил нас без пароля.
    await expect(page).toHaveURL(/\/auth\/signup/);
  });
});

test.describe("Вход — независимые проверки без создания аккаунтов", () => {
  test("вход с несуществующим email показывает ошибку, а не 500-ю и не тихий провал", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.fillForm(`nobody-${Date.now()}@wrench-test.dev`, "SomePassword123!");
    await login.submit();

    await expect(login.errorMessage).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("пустая форма входа блокируется валидацией браузера (оба поля required)", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    const emailValid = await login.emailInput.evaluate((el: HTMLInputElement) => el.checkValidity());
    const passwordValid = await login.passwordInput.evaluate((el: HTMLInputElement) => el.checkValidity());
    expect(emailValid).toBe(false);
    expect(passwordValid).toBe(false);
  });

  test("ссылка «Forgot password» ведёт на страницу восстановления пароля", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.forgotPasswordLink.click();
    await page.waitForURL(/\/auth\/forgot-password/, { timeout: 10_000 });
  });
});