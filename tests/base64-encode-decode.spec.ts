import { test, expect } from "@playwright/test";
import { Base64Page } from "./pages/Base64Page";

test.describe("Base64 Encode / Decode", () => {

  let tool: Base64Page;

  test.beforeEach(async ({ page }) => {
    tool = new Base64Page(page);
    await tool.goto();
  });

  test("по умолчанию режим Encode и уже есть пример текста", async () => {
    // btoa("Hello, Wrench-Branch!") — считаем эталон средствами Node,
    // а не переписываем вручную, чтобы не ошибиться в строке руками.
    const expected = Buffer.from("Hello, Wrench-Branch!", "utf-8").toString("base64");
    await expect(tool.output).toHaveValue(expected);
  });

  test("кодирует произвольный текст в Base64", async () => {
    const text = "QA engineer testing Wrench-Branch";
    await tool.setInput(text);
    const expected = Buffer.from(text, "utf-8").toString("base64");
    await expect(tool.output).toHaveValue(expected);
  });

  test("режим Decode превращает Base64 обратно в исходный текст", async () => {
    const original = "roundtrip check 123";
    const encoded = Buffer.from(original, "utf-8").toString("base64");

    await tool.decodeButton.click();
    await tool.setInput(encoded);

    await expect(tool.output).toHaveValue(original);
  });

  test("невалидная Base64 строка в режиме Decode показывает ошибку, а не мусор", async () => {
    await tool.decodeButton.click();
    await tool.setInput("это точно не base64 !!! ###");

    await expect(tool.errorMessage).toBeVisible();
    await expect(tool.errorMessage).toContainText("Invalid Base64 string");
  });

  test("переключение обратно на Encode убирает ошибку и снова считает", async () => {
    await tool.decodeButton.click();
    await tool.setInput("не base64");
    await expect(tool.errorMessage).toBeVisible();

    await tool.encodeButton.click();
    await expect(tool.errorMessage).toBeHidden();
    const expected = Buffer.from("не base64", "utf-8").toString("base64");
    await expect(tool.output).toHaveValue(expected);
  });

});
