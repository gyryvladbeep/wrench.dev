import { test, expect } from "@playwright/test";
import { HtmlEncodeDecodePage } from "./pages/HtmlEncodeDecodePage";

/** Та же функция кодирования, что в компоненте
 *  (components/tools/HtmlEncodeDecodeTool.tsx) — считаем эталон ею же,
 *  а не подбираем результат вручную: порядок пяти последовательных
 *  .replace() легко перепутать на бумаге (например, экранировать "&"
 *  не первым — тогда "&lt;" сам превратился бы в "&amp;lt;"). */
function encodeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const DEFAULT_INPUT = '<p class="greeting">Hello & <strong>World</strong>!</p>';

test.describe("HTML Encode / Decode", () => {
  let tool: HtmlEncodeDecodePage;

  test.beforeEach(async ({ page }) => {
    tool = new HtmlEncodeDecodePage(page);
    await tool.goto();
  });

  test("по умолчанию режим Encode и уже есть пример HTML", async () => {
    await expect(tool.output).toHaveValue(encodeHtml(DEFAULT_INPUT));
  });

  test("амперсанд кодируется первым и не даёт двойного экранирования", async () => {
    const text = "A & B < C > D";
    await tool.setInput(text);
    const value = await tool.output.inputValue();
    expect(value).toBe(encodeHtml(text));
    expect(value).not.toMatch(/amp;lt;|amp;gt;/);
  });

  test("кавычки кодируются в &quot; и &#039;", async () => {
    const text = `"double" and 'single'`;
    await tool.setInput(text);
    await expect(tool.output).toHaveValue("&quot;double&quot; and &#039;single&#039;");
  });

  test("режим Decode превращает HTML-сущности обратно в исходные символы", async () => {
    await tool.decodeButton.click();
    await tool.setInput("Tom &amp; Jerry &lt;3");
    await expect(tool.output).toHaveValue("Tom & Jerry <3");
  });

  test("Encode → Decode на одном и том же тексте — round trip без потерь", async () => {
    const encoded = await tool.output.inputValue(); // уже Encode по умолчанию
    expect(encoded).toBe(encodeHtml(DEFAULT_INPUT));

    await tool.decodeButton.click();
    await tool.setInput(encoded);
    await expect(tool.output).toHaveValue(DEFAULT_INPUT);
  });
});
