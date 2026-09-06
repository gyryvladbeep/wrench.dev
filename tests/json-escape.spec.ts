import { test, expect } from "@playwright/test";
import { JsonEscapePage } from "./pages/JsonEscapePage";

// Точная копия дефолтного значения из components/tools/JsonEscapeTool.tsx.
const DEFAULT_INPUT = `{"name":"Ada Lovelace","quote":"She said \\"hello\\"!"}`;

test.describe("JSON Escape / Unescape", () => {
  let tool: JsonEscapePage;

  test.beforeEach(async ({ page }) => {
    tool = new JsonEscapePage(page);
    await tool.goto();
  });

  test("по умолчанию режим Escape — экранирует пример строки как JSON-строку", async () => {
    await expect(tool.output).toHaveValue(JSON.stringify(DEFAULT_INPUT));
  });

  test("режим Unescape превращает JSON-строку с \\n обратно в реальный перевод строки", async () => {
    await tool.unescapeButton.click();
    await tool.setInput('"line1\\nline2"');

    await expect(tool.output).toHaveValue("line1\nline2");
  });

  test("Escape → Unescape по экранированному результату возвращает исходный текст", async () => {
    const escaped = JSON.stringify(DEFAULT_INPUT);

    await tool.unescapeButton.click();
    await tool.setInput(escaped);

    await expect(tool.output).toHaveValue(DEFAULT_INPUT);
  });

  test("Unescape JSON-объекта (не строки) выводит его в форматированном виде", async () => {
    await tool.unescapeButton.click();
    await tool.setInput('{"a":1}');

    await expect(tool.output).toHaveValue(JSON.stringify({ a: 1 }, null, 2));
  });

  test("невалидный JSON в режиме Unescape показывает сообщение об ошибке", async () => {
    await tool.unescapeButton.click();
    await tool.setInput('"unterminated');

    await expect(tool.output).toHaveValue(/^Error: /);
  });
});
