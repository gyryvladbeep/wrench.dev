import { test, expect, Page } from "@playwright/test";
import { SignupPage } from "./pages/SignupPage";
import { WorkbenchPage } from "./pages/WorkbenchPage";
import { PublicWorkbenchPage } from "./pages/PublicWorkbenchPage";

/**
 * ═══════════════════════════════════════════════════════════════
 * WORKBENCH: создание/переименование/удаление, инструменты, лимиты,
 * свободный холст, публичный шаринг
 * ═══════════════════════════════════════════════════════════════
 * Workbench — фича, ради которой вообще стоит регистрироваться (см.
 * README/обсуждение фичи), и при этом самая новая и наименее
 * протестированная часть сайта. До этого файла у неё не было НИ
 * ОДНОГО автотеста.
 *
 * Как и auth-flow.spec.ts, этот файл бьёт по настоящему Supabase —
 * без реального аккаунта у /workbench нет смысла (страница защищена
 * авторизацией). Один test.describe.serial с одним page на всю
 * группу — по той же причине, что и там: нам нужен один и тот же
 * рабочий стол от шага к шагу, а не свежий пустой аккаунт на каждый
 * test().
 *
 * ВАЖНО: этот файл требует настоящих переменных окружения Supabase
 * (см. .env.local.example) — в песочнице без .env.local он не может
 * быть прогнан и проверен локально; корректность проверена только
 * чтением кода и сверкой с реальными локаторами/строками компонентов.
 *
 * ПОБОЧНЫЙ ЭФФЕКТ: создаёт одного реального пользователя в боевой базе
 * (email вида wb-test-<timestamp>@wrench-test.dev) — чисти вместе с
 * qa-test-* из auth-flow.spec.ts в Supabase Dashboard → Authentication
 * → Users.
 */

function uniqueTestEmail(): string {
  return `wb-test-${Date.now()}-${Math.floor(Math.random() * 100000)}@wrench-test.dev`;
}

const PASSWORD = "TestPassword123!";

test.describe.serial("Workbench: жизненный цикл рабочего стола", () => {
  let page: Page;
  let wb: WorkbenchPage;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    const signup = new SignupPage(page);
    await signup.goto();
    await signup.fillForm(uniqueTestEmail(), PASSWORD);
    await signup.submit();
    // Успешная регистрация ведёт на главную (см. auth-flow.spec.ts) —
    // /workbench открываем отдельным переходом, как обычный пользователь
    // сделал бы кликом по нав-ссылке.
    await page.waitForURL((url) => url.pathname === "/" || url.pathname === "/en", { timeout: 15_000 });
    wb = new WorkbenchPage(page);
    await wb.goto();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("первый визит создаёт дефолтный рабочий стол 'My Workbench' и показывает пустое состояние", async () => {
    await expect(wb.heading).toContainText("My Workbench");
    await expect(wb.workspaceTab("My Workbench")).toBeVisible();
    await expect(wb.emptyState).toBeVisible();
    await expect(wb.toolCountText()).toHaveText("0/6 tools");
  });

  test("двойной клик по вкладке переименовывает рабочий стол", async () => {
    await wb.renameActiveWorkspace("My Workbench", "QA Suite");
    await expect(wb.workspaceTab("QA Suite")).toBeVisible();
    await expect(wb.workspaceTab("My Workbench")).toBeHidden();
  });

  test("поиск в модалке выбора инструментов фильтрует список", async () => {
    await wb.openToolPicker();
    await wb.pickerSearchInput.fill("uuid");
    await expect(wb.pickerToolRow("UUID Generator")).toBeVisible();
    // JSON Formatter не должен пройти фильтр по запросу "uuid".
    await expect(wb.pickerRoot.getByText("JSON Formatter", { exact: true })).toBeHidden();
    await wb.pickerSearchInput.fill("");
    await wb.closeToolPicker();
  });

  test("добавление инструмента из модалки показывает его на странице и обновляет счётчик", async () => {
    await wb.openToolPicker();
    await wb.addToolFromPicker("JSON Formatter");
    await wb.closeToolPicker();
    await expect(wb.toolCardHeading("JSON Formatter")).toBeVisible();
    await expect(wb.emptyState).toBeHidden();
    await expect(wb.toolCountText()).toHaveText("1/6 tools");
  });

  test("кнопка ✕ убирает инструмент — счётчик и пустое состояние возвращаются", async () => {
    await wb.removeTool("JSON Formatter");
    await expect(wb.toolCardHeading("JSON Formatter")).toBeHidden();
    await expect(wb.emptyState).toBeVisible();
    await expect(wb.toolCountText()).toHaveText("0/6 tools");
  });

  test("лимит free-тарифа — 6 инструментов на рабочий стол, 7-й недоступен и виден апсэйл на Pro", async () => {
    const sixTools = [
      "JSON Formatter", "UUID Generator", "HTTP Status Codes",
      "Regex Tester", "XPath Generator", "CSS Selector Generator",
    ];
    await wb.openToolPicker();
    for (const name of sixTools) {
      await wb.addToolFromPicker(name);
    }
    await expect(wb.pickerLimitBanner).toBeVisible();
    await expect(wb.pickerLimitBanner.getByRole("link", { name: "Upgrade to Pro" })).toHaveAttribute("href", /\/pro/);

    // 7-й инструмент физически недоступен для клика, а не просто "не
    // добавляется молча" — раньше это уже случалось с другими фичами.
    await expect(wb.pickerToolRow("Base64 Encode / Decode")).toBeDisabled();
    await wb.closeToolPicker();

    await expect(wb.toolCountText()).toHaveText("6/6 tools");
    for (const name of sixTools) {
      await expect(wb.toolCardHeading(name)).toBeVisible();
    }
  });

  test("новые инструменты на свободном холсте получают дефолтную каскадную раскладку — карточки не накладываются друг на друга", async () => {
    // Проверяем geometry, заданную defaultToolPosition() в
    // lib/workbench-layout.ts, через фактически отрисованные координаты,
    // а не через её внутренние константы — так тест ловит и регрессии в
    // самой WorkbenchCanvas (например, если она перестанет читать layout
    // из хука и станет складывать карточки в одну точку).
    const jsonFormatter = await wb.cardPosition("JSON Formatter");   // индекс 0 → колонка 0, ряд 0
    const uuidGenerator  = await wb.cardPosition("UUID Generator");  // индекс 1 → колонка 1, тот же ряд
    const regexTester    = await wb.cardPosition("Regex Tester");    // индекс 3 → колонка 0, следующий ряд

    // Соседняя колонка — заметно правее, та же высота (одна строка каскада).
    expect(uuidGenerator.x - jsonFormatter.x).toBeGreaterThan(200);
    expect(Math.abs(uuidGenerator.y - jsonFormatter.y)).toBeLessThan(10);

    // Следующая строка каскада — заметно ниже, та же колонка.
    expect(regexTester.y - jsonFormatter.y).toBeGreaterThan(150);
    expect(Math.abs(regexTester.x - jsonFormatter.x)).toBeLessThan(10);
  });

  test("промо-карточка Workbench на странице профиля показывает актуальное число закреплённых инструментов", async () => {
    // Сама фича задумана как крючок для регистрации (см. комментарий в
    // profile/page.tsx) — если карточка врёт про количество, весь смысл
    // промо теряется. У нас сейчас 6 инструментов в одном рабочем столе.
    await page.goto("/en/profile");
    await expect(page.getByText(/6 tools pinned across 1 workspace/)).toBeVisible();
    await page.getByRole("link", { name: "Open" }).click();
    await page.waitForURL(/\/workbench/, { timeout: 10_000 });
  });

  test("карточки инструментов можно перетаскивать по свободному холсту", async () => {
    // На свободном холсте перетаскивание меняет не визуальный порядок в
    // сетке (сетки больше нет), а позицию карточки и её z-index: WorkbenchCanvas
    // рисует карточки в порядке tool_slugs, и moveTool() переносит
    // перетащенный slug в конец массива — последняя тронутая карточка
    // оказывается поверх остальных, если случайно перекрылись. Проверяем
    // именно это: порядок массива (= порядок заголовков в DOM) меняется,
    // но набор карточек остаётся тем же.
    const before = await wb.currentCardOrder();
    // Перетаскиваем первую карточку на место последней.
    await wb.dragCardOnto(before[0], before[before.length - 1]);
    const after = await wb.currentCardOrder();

    expect(after).not.toEqual(before);
    expect(after.sort()).toEqual(before.sort()); // тот же набор, другой порядок
  });

  test("шаринг: включение публичной ссылки открывает read-only копию холста без авторизации", async ({ browser }) => {
    const shareUrl = await wb.enablePublicSharingAndGetUrl();
    expect(shareUrl).toMatch(/\/w\/[^/]+$/);

    // Отдельный, полностью неавторизованный контекст — не переиспользуем
    // cookies основной сессии, иначе тест не отличил бы "страница
    // доступна всем по ссылке" от "страница доступна МНЕ, потому что я и
    // так залогинен".
    const anonContext = await browser.newContext();
    const anonPage = await anonContext.newPage();
    const publicView = new PublicWorkbenchPage(anonPage);
    await anonPage.goto(shareUrl);

    await publicView.expectFound();
    await expect(publicView.heading).toHaveText("QA Suite");
    await expect(publicView.toolCardHeading("JSON Formatter")).toBeVisible();
    // Read-only и в самом деле означает "нельзя редактировать" — не
    // просто визуальная пометка.
    await expect(publicView.removeToolButton("JSON Formatter")).toHaveCount(0);

    await anonContext.close();
  });

  test("шаринг: выключение публичной ссылки закрывает доступ по ней", async ({ browser }) => {
    const shareUrl = await wb.enablePublicSharingAndGetUrl();
    await wb.disablePublicSharing();

    const anonContext = await browser.newContext();
    const anonPage = await anonContext.newPage();
    const publicView = new PublicWorkbenchPage(anonPage);
    await anonPage.goto(shareUrl);

    await publicView.expectNotFound();
    await anonContext.close();
  });

  test("free-тариф не может создать второй рабочий стол — вместо кнопки лимит и ссылка на Pro", async () => {
    await expect(wb.newWorkspaceButton).toBeHidden();
    await expect(wb.limitWorkspacesText).toBeVisible();
    await expect(wb.limitWorkspacesText.getByRole("link", { name: "Upgrade to Pro" })).toHaveAttribute("href", /\/pro/);
  });

  test("удаление рабочего стола требует подтверждения (не нативный confirm) и освобождает лимит", async () => {
    await wb.startDeleteConfirmation();

    // Cancel — рабочий стол должен остаться на месте.
    await wb.cancelDeleteButton.click();
    await expect(wb.workspaceTab("QA Suite")).toBeVisible();

    await wb.startDeleteConfirmation();
    await wb.confirmDeleteButton.click();

    await expect(wb.workspaceTab("QA Suite")).toBeHidden();
    // Лимит освободился — кнопка создания снова доступна.
    await expect(wb.newWorkspaceButton).toBeVisible();
  });

});
