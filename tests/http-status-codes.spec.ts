import { test, expect } from "@playwright/test";
import { HttpStatusCodesPage } from "./pages/HttpStatusCodesPage";

test.describe("HTTP Status Codes", () => {

  let statusCodes: HttpStatusCodesPage;

  test.beforeEach(async ({ page }) => {
    statusCodes = new HttpStatusCodesPage(page);
    await statusCodes.goto();
  });

  test("страница открывается и показывает полный список кодов", async () => {
    // ─────────────────────────────────────────────────────────
    // УРОК: тестируем реальный БАГ, который мы только что нашли
    // и исправили в этой же сессии — этот инструмент раньше вообще
    // не рендерился (компонент импортировался, но не было case в
    // switch). Такой тест — это "регрессионный тест": он не даст
    // этому же багу вернуться незамеченным в будущем, если кто-то
    // случайно уберёт эту строку снова.
    // ─────────────────────────────────────────────────────────
    const count = await statusCodes.getVisibleCount();
    expect(count).toBeGreaterThan(10); // список точно большой (25+ кодов)
  });

  test("поиск по коду 404 находит нужную запись", async () => {
    await statusCodes.search("404");

    // ─────────────────────────────────────────────────────────
    // УРОК: strict mode violation — ещё один частый повторяющийся
    // сценарий. getByText("Not Found") без exact ищет ЛЮБОЙ текст,
    // который содержит эту подстроку регистронезависимо — и совпал
    // не только с заголовком кода 404, но и с фрагментом описания
    // самого 404 ("Resource NOT FOUND at this URI") — Playwright
    // считает регистронезависимое частичное совпадение допустимым
    // по умолчанию. Добавляем exact: true, чтобы искать ТОЧНОЕ
    // совпадение всего текста элемента, а не любое частичное.
    // ─────────────────────────────────────────────────────────
    await expect(statusCodes.page.getByText("Not Found", { exact: true })).toBeVisible();

    // Проверяем что список СУЗИЛСЯ — поиск реально фильтрует,
    // а не просто ничего не делает.
    // (поиск "404" находит 2 записи: код 404 сам по себе, и код 410
    // Gone — потому что в его ОПИСАНИИ упоминается "Unlike 404")
    const count = await statusCodes.getVisibleCount();
    expect(count).toBeLessThan(5);
  });

  test("поиск по названию 'Unauthorized' находит код 401", async () => {
    await statusCodes.search("Unauthorized");
    await expect(statusCodes.page.getByText("401", { exact: true })).toBeVisible();
  });

  test("поиск несуществующего кода показывает 'No results found'", async () => {
    await statusCodes.search("999999");
    await expect(statusCodes.noResultsMsg).toBeVisible();
  });

  test("фильтр '5xx' показывает только серверные ошибки", async () => {
    await statusCodes.filterByCategory("5xx");

    // Все видимые коды должны начинаться с "5"
    const allCodes = await statusCodes.page.locator(".font-mono.font-bold").allTextContents();
    const allAreServerErrors = allCodes.every((code) => code.trim().startsWith("5"));

    expect(allCodes.length).toBeGreaterThan(0); // список не пустой
    expect(allAreServerErrors).toBe(true);
  });

  test("фильтр 'all' возвращает полный список после сужения", async () => {
    await statusCodes.filterByCategory("4xx");
    const narrowedCount = await statusCodes.getVisibleCount();

    await statusCodes.filterByCategory("all");
    const fullCount = await statusCodes.getVisibleCount();

    // После возврата к "all" список должен снова стать больше
    expect(fullCount).toBeGreaterThan(narrowedCount);
  });

});