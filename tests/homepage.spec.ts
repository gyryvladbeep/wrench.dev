import { test, expect } from "@playwright/test";

/**
 * ═══════════════════════════════════════════════════════════════
 * УРОВЕНЬ 1 — ПЕРВЫЕ ТЕСТЫ
 * ═══════════════════════════════════════════════════════════════
 *
 * Структура любого теста — это паттерн AAA (Arrange-Act-Assert):
 *
 * 1. ARRANGE (подготовка) — открываем страницу, готовим данные
 * 2. ACT (действие)       — кликаем, вводим текст, переходим по ссылке
 * 3. ASSERT (проверка)    — проверяем что результат ожидаемый
 *
 * test.describe() группирует связанные тесты — как describe в Jest/Mocha
 * test() — это один конкретный тест-кейс
 */

test.describe("Главная страница", () => {

  test("страница открывается и показывает заголовок", async ({ page }) => {
    // ARRANGE — переходим на главную страницу
    // baseURL уже настроен в playwright.config.ts, поэтому пишем только "/"
    await page.goto("/en");

    // ASSERT — проверяем что заголовок вкладки браузера правильный
    await expect(page).toHaveTitle(/Wrench/);
  });

  test("виден главный заголовок H1", async ({ page }) => {
    await page.goto("/en");

    // Ищем элемент h1 на странице и проверяем что он видим
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();

    // Проверяем что в заголовке есть нужный текст
    await expect(heading).toContainText("Developer");
  });

  test("кнопка 'Browse tools' ведёт на страницу инструментов", async ({ page }) => {
    await page.goto("/en");

    // ACT — находим ссылку по тексту и кликаем.
    // Playwright.waitForURL ждёт, пока браузер реально не перейдёт по новому адресу —
    // это надёжнее чем просто проверить URL сразу после клика.
    await page.getByRole("link", { name: "Browse tools" }).click();
    await page.waitForURL(/\/tools/, { timeout: 10_000 });

    // ASSERT — проверяем что URL изменился
    await expect(page).toHaveURL(/\/tools/);
  });

  test("переключатель языка меняет язык интерфейса", async ({ page }) => {
    await page.goto("/en");

    // Кликаем на кнопку RU в хедере
    await page.getByRole("button", { name: "RU", exact: true }).click();
    await page.waitForURL(/\/ru/, { timeout: 10_000 });

    // Проверяем что URL изменился на русскую версию
    await expect(page).toHaveURL(/\/ru/);

    // Проверяем что текст на странице теперь на русском
    await expect(page.locator("h1")).toContainText("Инструменты");
  });

});