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
    // Закрываем НЕ очищая поле — именно так поймали баг ниже: модалка не
    // размонтируется при закрытии (page.tsx всегда рендерит
    // <ToolPickerModal open={pickerOpen} .../>, компонент просто вернёт
    // null), так что query в её локальном состоянии раньше переживал
    // закрытие и встречал пользователя тем же фильтром в следующий раз.
    await wb.closeToolPicker();
  });

  test("повторное открытие модалки сбрасывает старый поисковый запрос", async () => {
    // Регрессия на баг, пойманный при тестировании фичи (2026-09-09):
    // модалка не размонтируется на закрытии, и без явного сброса query
    // в ToolPickerModal предыдущий запрос ("uuid" из теста выше) молча
    // фильтровал список при следующем открытии — так что пользователь,
    // ищущий уже другой инструмент, видел пустой/urезанный список без
    // очевидной причины.
    await wb.openToolPicker();
    await expect(wb.pickerSearchInput).toHaveValue("");
    await expect(wb.pickerToolRow("JSON Formatter")).toBeVisible();
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
    //
    // ВАЖНО про выбор карточек для сравнения: WorkbenchCanvas отдельно
    // подвигает вниз любую карточку, чья дефолтная каскадная позиция
    // попадает под плавающую панель вкладок/действий (см. avoidPanel() и
    // avoidTopLeft в WorkbenchCanvas.tsx) — это сделано намеренно, чтобы
    // карточка не рождалась полностью закрытой панелью и недоступной для
    // клика, а не баг. Из-за этого раньше здесь сравнивались JSON
    // Formatter (колонка 0, ряд 0) и UUID Generator (колонка 1, ряд 0) —
    // при реальном/оценочном размере панели (см. INITIAL_PANEL_ESTIMATE в
    // page.tsx, 540×230) обе эти клетки попадают под панель и обе
    // одинаково сдвигаются вниз, а Regex Tester (колонка 0, ряд 1, y=280)
    // уже ниже панели и никуда не сдвигается — сравнение "ряд 0 vs ряд 1"
    // на самом деле сравнивало "сдвинутая карточка" vs "несдвинутая",
    // получая разницу в 34px вместо ожидаемых 260. Колонка 2 (x=924)
    // физически недостижима для панели такой ширины ни в одном ряду, а
    // весь ряд 1 (y=280) уже ниже её высоты — сравниваем только эти
    // заведомо не подвинутые avoidPanel() карточки.
    const httpStatusCodes = await wb.cardPosition("HTTP Status Codes");      // индекс 2 → колонка 2, ряд 0
    const cssSelector     = await wb.cardPosition("CSS Selector Generator"); // индекс 5 → колонка 2, ряд 1
    const regexTester     = await wb.cardPosition("Regex Tester");          // индекс 3 → колонка 0, ряд 1
    const xpathGenerator  = await wb.cardPosition("XPath Generator");       // индекс 4 → колонка 1, ряд 1

    // Соседняя колонка внутри одной строки каскада (ряд 1) — заметно
    // правее, та же высота.
    expect(xpathGenerator.x - regexTester.x).toBeGreaterThan(200);
    expect(Math.abs(xpathGenerator.y - regexTester.y)).toBeLessThan(10);

    // Следующая строка каскада в той же колонке (2) — заметно ниже, тот же x.
    expect(cssSelector.y - httpStatusCodes.y).toBeGreaterThan(150);
    expect(Math.abs(cssSelector.x - httpStatusCodes.x)).toBeLessThan(10);
  });

  test("ручка в углу карточки меняет её размер — растёт по курсору и не сжимается меньше минимума", async () => {
    // CSS Selector Generator — последняя карточка каскада (ряд 1, колонка
    // 2, см. предыдущий тест): справа и снизу от неё пока нет соседей, так
    // что рост карточки не наедет на чужую и не перехватит у неё клик —
    // именно это и оказалось ложной тревогой при ручной проверке фичи на
    // уже раздвинутой карточке с соседом впритык.
    //
    // НО у колонки 2 в каскаде x=924 (см. CASCADE_COL_GAP в
    // lib/workbench-layout.ts: 20 + 2*452), а ширина карточки по
    // умолчанию 420 (CANVAS_CARD_WIDTH) — правый край на x=1344. Это шире
    // стандартного вьюпорта Desktop Chrome, которым Playwright гоняет
    // тесты по умолчанию (1280×720, см. playwright.config.ts). Ручка
    // ресайза в правом нижнем углу такой карточки физически рисуется за
    // пределами вьюпорта — курсору Playwright там некуда "навестись":
    // resizeCard() молча промахивается мимо неё, mousedown не запускает
    // ресайз, и размер карточки остаётся прежним (ровно это и произошло —
    // этот тест ни разу не успевал выполниться раньше, потому что перед
    // ним стабильно падал тест каскадной раскладки и обрывал всю
    // serial-серию). Расширяем вьюпорт только на время этого теста и
    // возвращаем обратно, чтобы не менять условия для тестов после него.
    await page.setViewportSize({ width: 1600, height: 900 });

    const before = await wb.cardSize("CSS Selector Generator");
    await wb.resizeCard("CSS Selector Generator", 80, 60);
    const grown = await wb.cardSize("CSS Selector Generator");
    expect(Math.abs(grown.width - (before.width + 80))).toBeLessThan(3);
    expect(Math.abs(grown.height - (before.height + 60))).toBeLessThan(3);

    // Отдельно — резкая попытка сжать карточку в ничто должна упереться в
    // MIN_CARD_WIDTH/MIN_CARD_HEIGHT (lib/workbench-layout.ts), а не
    // схлопнуть её до нуля или отрицательных размеров.
    await wb.resizeCard("CSS Selector Generator", -900, -900);
    const shrunk = await wb.cardSize("CSS Selector Generator");
    expect(shrunk.width).toBe(280);
    expect(shrunk.height).toBe(160);

    await page.setViewportSize({ width: 1280, height: 720 });
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

    // Регрессия на баг, пойманный при тестировании (2026-09-09): бегунок
    // тогла раньше не имел явного left, полагался на "статическую
    // позицию" браузера для абсолютно спозиционированного span'а без
    // left/right — на практике она оказывалась не нулевой, и во
    // включённом состоянии бегунок заметно вылезал за правый край
    // дорожки. Проверяем геометрию впрямую: bounding box бегунка должен
    // целиком помещаться внутри bounding box дорожки, а не просто
    // визуально "выглядеть похоже".
    const trackBox = await wb.sharePublicToggle.boundingBox();
    const knobBox = await wb.sharePublicToggle.locator("span").boundingBox();
    if (!trackBox || !knobBox) throw new Error("тогл 'Публичная ссылка' не отрисован");
    expect(knobBox.x).toBeGreaterThanOrEqual(trackBox.x);
    expect(knobBox.x + knobBox.width).toBeLessThanOrEqual(trackBox.x + trackBox.width);

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
