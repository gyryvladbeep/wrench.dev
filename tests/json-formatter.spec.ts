import { test, expect } from "@playwright/test";
import { JsonFormatterPage } from "./pages/JsonFormatterPage";

/**
 * ═══════════════════════════════════════════════════════════════
 * ЭТОТ ФАЙЛ ПЕРЕПИСАН НА PAGE OBJECT MODEL
 * ═══════════════════════════════════════════════════════════════
 * Сравни с версией до рефакторинга (была в предыдущем уроке) —
 * тут больше НЕТ ни одного page.locator("textarea") — вся эта
 * "техническая грязь" переехала в pages/JsonFormatterPage.ts.
 *
 * Тесты теперь читаются почти как обычный текст:
 * "введи JSON" → "проверь что вывод содержит текст"
 * Понятно даже человеку, который не пишет код.
 */

test.describe("JSON Formatter", () => {

  // Переменная для Page Object — будет создаваться заново для каждого теста
  let jsonFormatter: JsonFormatterPage;

  test.beforeEach(async ({ page }) => {
    // Создаём "пульт управления" для этой страницы
    jsonFormatter = new JsonFormatterPage(page);
    await jsonFormatter.goto();
  });

  test("страница инструмента открывается", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("JSON Formatter");
  });

  test("невалидный JSON показывает сообщение об ошибке", async () => {
    await jsonFormatter.enterJson('{"name": "test"');
    await jsonFormatter.expectErrorVisible();

    // Дополнительно проверяем что там реально есть текст (не пустой блок)
    const errorText = await jsonFormatter.errorBox.textContent();
    expect(errorText).toBeTruthy();
    expect(errorText!.length).toBeGreaterThan(5);
  });

  test("валидный JSON форматируется с отступами", async () => {
    await jsonFormatter.enterJson('{"city":"Yerevan","population":1100000}');

    await jsonFormatter.expectOutputToContain("Yerevan");
    await jsonFormatter.expectOutputToContain("\\n"); // содержит перенос строки
  });

  test("кнопка Minify убирает форматирование", async () => {
    await jsonFormatter.enterJson('{"a": 1, "b": 2}');
    await jsonFormatter.clickMinify();

    const value = await jsonFormatter.getOutputValue();
    expect(value).not.toContain("\n");
  });

  test("кнопка Copy копирует результат в буфер обмена", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await jsonFormatter.enterJson('{"test": true}');
    await jsonFormatter.copyButton.click();

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain("test");
  });

});