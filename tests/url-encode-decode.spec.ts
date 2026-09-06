import { test, expect } from "@playwright/test";
import { UrlEncodeDecodePage } from "./pages/UrlEncodeDecodePage";

const DEFAULT_INPUT = "https://example.com/search?q=hello world&lang=en";

test.describe("URL Encode / Decode", () => {
  let tool: UrlEncodeDecodePage;

  test.beforeEach(async ({ page }) => {
    tool = new UrlEncodeDecodePage(page);
    await tool.goto();
  });

  test("по умолчанию режим Encode и уже есть пример URL", async () => {
    await expect(tool.output).toHaveValue(encodeURIComponent(DEFAULT_INPUT));
  });

  test("кодирует пробелы и амперсанды в query-строке", async () => {
    const text = "a b&c=d";
    await tool.setInput(text);
    await expect(tool.output).toHaveValue(encodeURIComponent(text));
  });

  test("режим Decode превращает %XX-последовательности обратно в текст", async () => {
    const original = "hello world & friends";
    const encoded = encodeURIComponent(original);

    await tool.decodeButton.click();
    await tool.setInput(encoded);

    await expect(tool.output).toHaveValue(original);
  });

  test("невалидная %-последовательность в режиме Decode показывает ошибку", async () => {
    await tool.decodeButton.click();
    await tool.setInput("100% not valid %ZZ");

    await expect(tool.errorMessage).toBeVisible();
  });

  test("переключение обратно на Encode убирает ошибку и снова считает", async () => {
    await tool.decodeButton.click();
    await tool.setInput("%ZZ broken");
    await expect(tool.errorMessage).toBeVisible();

    await tool.encodeButton.click();
    await expect(tool.errorMessage).toBeHidden();
    await expect(tool.output).toHaveValue(encodeURIComponent("%ZZ broken"));
  });
});
