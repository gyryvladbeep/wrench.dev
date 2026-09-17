import path from "node:path";
import { test, expect, Page } from "@playwright/test";
import { SignupPage } from "./pages/SignupPage";
import { MockApiPage } from "./pages/MockApiPage";

/**
 * ═══════════════════════════════════════════════════════════════
 * MOCK API: импорт коллекции Postman/Insomnia
 * ═══════════════════════════════════════════════════════════════
 * Чистая логика разбора (парсинг Postman/Insomnia в маршруты) уже
 * покрыта отдельно и без браузера в tests/mock-api-collection-parser.spec.ts
 * — этот файл проверяет то, что тот не может: реальный путь пользователя
 * (загрузил файл → увидел превью → импортировал) и, самое главное, что
 * импортированный маршрут ДЕЙСТВИТЕЛЬНО отвечает на публичном mock-URL
 * тем телом, которое было в примере из коллекции — то есть весь путь
 * "файл на диске → живой mock-эндпоинт" целиком, а не только парсер.
 *
 * Как и workbench.spec.ts/auth-flow.spec.ts, этот файл бьёт по
 * настоящему Supabase — Mock API целиком спрятан за авторизацией
 * (гость видит только "Sign in to create mock endpoints", см.
 * MockApiClient.tsx), так что без реального аккаунта тут нечего
 * тестировать. Один test.describe.serial с одним page на всю группу —
 * по той же причине, что в workbench.spec.ts: тест 3 (лимит маршрутов)
 * намеренно продолжает состояние, оставленное тестом 2 (тот же
 * единственный free-эндпоинт, уже не пустой).
 *
 * ВАЖНО: как и workbench.spec.ts, этот файл требует настоящих
 * переменных окружения Supabase (.env.local.example) — в этой
 * песочнице без .env.local прогнать и увидеть его зелёным нельзя;
 * корректность проверена чтением кода компонентов
 * (ImportCollectionModal.tsx, useMockEndpoints.ts) и сверкой с реальными
 * локаторами/строками, плюс отдельным прогоном
 * tests/mock-api-collection-parser.spec.ts (тот прошёл здесь, 15/15,
 * без браузера и без Supabase).
 *
 * ПОБОЧНЫЙ ЭФФЕКТ: создаёт одного реального пользователя в боевой базе
 * (email вида mockapi-test-<timestamp>@wrench-test.dev) — чисти вместе с
 * остальными тестовыми аккаунтами (qa-test-, wb-test- и т.д.) в Supabase
 * Dashboard → Authentication → Users.
 */

function uniqueTestEmail(): string {
  return `mockapi-test-${Date.now()}-${Math.floor(Math.random() * 100000)}@wrench-test.dev`;
}

const PASSWORD = "TestPassword123!";
const FIXTURES = path.join(__dirname, "fixtures", "mock-api");
const POSTMAN_FIXTURE = path.join(FIXTURES, "postman-collection.json");
// Отдельная маленькая коллекция для теста "повторный импорт в уже
// заполненный эндпоинт" ниже — один маршрут ("Get order by id")
// намеренно совпадает по method+path с уже сохранённым из
// POSTMAN_FIXTURE (тот же /orders/42, но с другим телом примера —
// "delivered" вместо "shipped", чтобы обновление было видно), второй
// ("List orders", GET /orders) — заведомо новый, ничего похожего в
// эндпоинте ещё нет.
const UPDATE_FIXTURE = path.join(FIXTURES, "postman-update-collection.json");

test.describe.serial("Mock API: импорт коллекции", () => {
  let page: Page;
  let mockApi: MockApiPage;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    const signup = new SignupPage(page);
    await signup.goto();
    await signup.fillForm(uniqueTestEmail(), PASSWORD);
    await signup.submit();
    await page.waitForURL((url) => url.pathname === "/" || url.pathname === "/en", { timeout: 15_000 });
    mockApi = new MockApiPage(page);
    await mockApi.goto();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("кнопка импорта видна авторизованному пользователю", async () => {
    await expect(mockApi.importButton).toBeVisible();
  });

  test("невалидный файл показывает понятную ошибку, не пропуская дальше превью", async () => {
    await mockApi.openImportModal();
    // Файл валидного JSON, но не Postman/Insomnia формата — специально
    // не переиспользуем postman-collection.json здесь.
    const buffer = Buffer.from(JSON.stringify({ hello: "world" }));
    await mockApi.fileInput.setInputFiles({ name: "not-a-collection.json", mimeType: "application/json", buffer });
    await expect(mockApi.fileError).toBeVisible();
    await expect(mockApi.previewHeading).toBeHidden();
    await mockApi.modalCloseButton.click();
  });

  test("импорт Postman-коллекции создаёт новый эндпоинт с маршрутом, отвечающим примером из коллекции", async () => {
    await mockApi.openImportModal();
    await mockApi.uploadFixture(POSTMAN_FIXTURE);
    await expect(mockApi.previewHeading).toContainText("Orders API");
    // 3 поддерживаемых маршрута (Get order by id, Create order, Ping) —
    // Preflight (OPTIONS) отфильтрован парсером, см.
    // mock-api-collection-parser.spec.ts.
    await expect(mockApi.previewHeading).toContainText("3");
    // Свободный тариф: 1 эндпоинт, targetCapacity=3 у нового — все 3
    // выбраны по умолчанию и укладываются без предупреждения о лимите.
    await expect(mockApi.confirmImportButton).toBeEnabled();
    await mockApi.confirmImportButton.click();
    await expect(page.getByText("Saved 3 route(s).")).toBeVisible();
    await mockApi.doneButton.click();

    // Финальная проверка — не UI, а реальный вызов публичного mock-URL:
    // маршрут "Get order by id" пришёл с сохранённым примером ответа
    // (originalRequest.url.path = ["orders","42"], code 200, body
    // {"id":42,"status":"shipped"}) — именно это и должен вернуть мок,
    // без единой ручной правки после импорта.
    const baseUrl = (await mockApi.baseUrlCode().textContent())?.trim();
    expect(baseUrl).toBeTruthy();
    const res = await page.request.get(`${baseUrl}/orders/42`);
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ id: 42, status: "shipped" });
  });

  test("повторный импорт в тот же (единственный, уже заполненный) эндпоинт: обновление уже существующего маршрута не требует слота, а новый — требует и блокирует кнопку, пока не снят", async () => {
    // После предыдущего теста эндпоинт уже ПОЛНОСТЬЮ заполнен: 3 из 3
    // (FREE_MAX_MOCK_ROUTES) — GET /orders/42, POST /orders, GET /ping.
    // Свободных слотов под новые маршруты — 0. UPDATE_FIXTURE предлагает
    // 2 маршрута: "Get order by id" (тот же GET /orders/42, что уже
    // есть — при сохранении обновит существующую строку, слота не
    // тратит) и "Health check" (GET /health — совсем новый путь,
    // которому просто негде поместиться).
    await mockApi.openImportModal();
    await mockApi.uploadFixture(UPDATE_FIXTURE);
    await expect(mockApi.previewHeading).toContainText("2");

    // Оба выбраны по умолчанию — один из них новый, а свободных слотов
    // нет вовсе, поэтому кнопка должна быть заблокирована.
    await expect(mockApi.confirmImportButton).toBeDisabled();

    // Снимаем галочку именно с НОВОГО маршрута (Health check) — тот, что
    // просто обновит /orders/42, слота и так не требовал, поэтому сам по
    // себе он блокировку никогда бы не снял (это и есть исправленное
    // поведение: снятие галочки с уже существующего маршрута раньше
    // ошибочно считалось "снимающим лимит", хотя реального слота он не
    // занимал ни до, ни после).
    await mockApi.routeRow("GET", "/health").locator('input[type="checkbox"]').uncheck();
    await expect(mockApi.confirmImportButton).toBeEnabled();
    await mockApi.confirmImportButton.click();
    await expect(page.getByText("Saved 1 route(s).")).toBeVisible();
    await mockApi.doneButton.click();

    // Публичный mock-URL действительно отдаёт ОБНОВЛЁННОЕ тело
    // ("delivered", а не "shipped" из первого импорта) — подтверждает,
    // что это было реальное обновление существующей строки, а не
    // no-op и не случайно пропущенный маршрут.
    const baseUrl = (await mockApi.baseUrlCode().textContent())?.trim();
    expect(baseUrl).toBeTruthy();
    const res = await page.request.get(`${baseUrl}/orders/42`);
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ id: 42, status: "delivered" });
  });
});
