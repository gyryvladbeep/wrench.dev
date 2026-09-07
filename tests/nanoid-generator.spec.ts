import { test, expect } from "@playwright/test";
import { NanoIdPage } from "./pages/NanoIdPage";

const DEFAULT_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-";

function allCharsIn(s: string, alphabet: string): boolean {
  return [...s].every((c) => alphabet.includes(c));
}

test.describe("NanoID Generator", () => {
  let tool: NanoIdPage;

  test.beforeEach(async ({ page }) => {
    tool = new NanoIdPage(page);
    await tool.goto();
  });

  test("по умолчанию 5 ID длиной 21 символ из стандартного алфавита", async () => {
    const lines = await tool.outputLines();
    expect(lines).toHaveLength(5);
    for (const id of lines) {
      expect(id).toHaveLength(21);
      expect(allCharsIn(id, DEFAULT_ALPHABET)).toBe(true);
    }
    // ID не должны совпадать друг с другом (криптографически случайны).
    expect(new Set(lines).size).toBe(5);
  });

  test("изменение size и count даёт нужное количество ID нужной длины", async () => {
    await tool.setSize(10);
    await tool.setCount(8);
    await tool.generateButton.click();

    const lines = await tool.outputLines();
    expect(lines).toHaveLength(8);
    for (const id of lines) {
      expect(id).toHaveLength(10);
    }
  });

  test("кастомный алфавит ограничивает набор символов в ID", async () => {
    await tool.setSize(12);
    await tool.setAlphabet("01");
    await tool.generateButton.click();

    const lines = await tool.outputLines();
    expect(lines.length).toBeGreaterThan(0);
    for (const id of lines) {
      expect(id).toHaveLength(12);
      expect(allCharsIn(id, "01")).toBe(true);
    }
  });

  test("count зажимается в 200 максимум при генерации", async () => {
    await tool.setCount(500);
    await tool.generateButton.click();

    const lines = await tool.outputLines();
    expect(lines).toHaveLength(200);
  });

  test("пустой алфавит блокирует генерацию — вывод не меняется", async () => {
    const before = await tool.outputLines();

    await tool.setAlphabet("");
    await tool.generateButton.click();

    const after = await tool.outputLines();
    expect(after).toEqual(before);
  });
});
