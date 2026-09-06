import { test, expect } from "@playwright/test";
import { Rot13Page } from "./pages/Rot13Page";

/** Тот же ROT13, что в компоненте (components/tools/EncodingTools.tsx) —
 *  считаем эталон идентичной функцией, а не сдвигаем буквы на бумаге
 *  (слишком легко ошибиться на одном символе). */
function rot13(str: string): string {
  return str.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

test.describe("ROT13", () => {
  let tool: Rot13Page;

  test.beforeEach(async ({ page }) => {
    tool = new Rot13Page(page);
    await tool.goto();
  });

  test("по умолчанию уже применён к примеру текста", async () => {
    await expect(tool.output).toHaveValue(rot13("Hello, Dev Toolbox!"));
  });

  test("цифры, пунктуация и кириллица не трогаются — сдвигается только латиница", async () => {
    const text = "QA-инженер 2026: Test #1, 100% ready!";
    await tool.setInput(text);
    await expect(tool.output).toHaveValue(rot13(text));
  });

  test("применённый дважды ROT13 возвращает исходный текст", async () => {
    const original = "The five boxing wizards jump quickly";
    await tool.setInput(original);
    const once = await tool.output.inputValue();
    await tool.setInput(once);
    await expect(tool.output).toHaveValue(original);
  });

  test("сохраняет регистр букв", async () => {
    await tool.setInput("AbCdEfGh");
    await expect(tool.output).toHaveValue(rot13("AbCdEfGh"));
  });
});
