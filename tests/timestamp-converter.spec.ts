import { test, expect } from "@playwright/test";
import { TimestampConverterPage } from "./pages/TimestampConverterPage";

// Инструмент считает даты через new Date(...) в браузере — результат
// зависит от часового пояса вкладки. Фиксируем его на UTC, иначе тест
// будет то проходить, то падать в зависимости от того, где его гоняют.
test.use({ timezoneId: "UTC" });

test.describe("Unix Timestamp Converter", () => {

  let tool: TimestampConverterPage;

  test.beforeEach(async ({ page }) => {
    tool = new TimestampConverterPage(page);
    await tool.goto();
  });

  test("timestamp 0 в секундах преобразуется в 1 января 1970 UTC", async () => {
    await tool.setTimestamp("0");
    // toContainText у локатора сам ждёт (поллит), пока текст не обновится —
    // в отличие от разового textContent() сразу после fill(), которое может
    // прочитать ещё не пересчитанный useMemo и словить гонку рендера.
    await expect(tool.timestampResultText()).toContainText("1970-01-01T00:00:00.000Z");
    await expect(tool.timestampResultText()).toContainText("Thu, 01 Jan 1970 00:00:00 GMT");
  });

  test("timestamp в миллисекундах (13+ цифр) распознаётся отдельно от секунд", async () => {
    // 1700000000000 мс = 2023-11-14T22:13:20.000Z. Если бы инструмент по
    // ошибке принял это число за секунды, дата уехала бы на десятки тысяч
    // лет вперёд — разница слишком заметна, чтобы тест мог случайно пройти.
    await tool.setTimestamp("1700000000000");
    await expect(tool.timestampResultText()).toContainText("2023-11-14T22:13:20.000Z");
  });

  test("нечисловой ввод не ломает страницу, а показывает подсказку", async () => {
    await tool.setTimestamp("не число");
    await expect(tool.page.getByText("Enter a numeric Unix timestamp above.")).toBeVisible();
  });

  test("выбор даты 1970-01-01T00:00 даёт 0 секунд и 0 миллисекунд", async () => {
    await tool.setDateTime("1970-01-01T00:00");
    await expect.poll(() => tool.getSecondsAndMillis()).toEqual({ seconds: 0, millis: 0 });
  });

  test("кнопка 'Now' подставляет текущее время в миллисекундах", async () => {
    const before = Date.now();
    await tool.nowButton.click();
    const value = Number(await tool.timestampInput.inputValue());
    const after = Date.now();

    expect(value).toBeGreaterThanOrEqual(before);
    expect(value).toBeLessThanOrEqual(after + 2000); // небольшой запас на задержки CI
  });

});
