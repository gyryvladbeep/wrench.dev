import { test, expect } from "@playwright/test";
import { RemoveDuplicatesPage } from "./pages/RemoveDuplicatesPage";

test.describe("Remove Duplicates", () => {
  let tool: RemoveDuplicatesPage;

  test.beforeEach(async ({ page }) => {
    tool = new RemoveDuplicatesPage(page);
    await tool.goto();
  });

  test("по умолчанию Case sensitive включён, убирает точные повторы строк", async () => {
    await expect(tool.caseSensitiveCheckbox).toBeChecked();
    await expect(tool.output).toHaveValue("apple\nbanana\ncherry\ndate");
    await expect(tool.removedCountText).toHaveText("2 duplicates removed");
  });

  test("при выключенном Case sensitive 'Apple' и 'apple' считаются одной строкой", async () => {
    await tool.caseSensitiveCheckbox.uncheck();
    await tool.setInput("Apple\napple\nAPPLE\nbanana");
    // Оставляем ПЕРВОЕ встреченное написание — "Apple".
    await expect(tool.output).toHaveValue("Apple\nbanana");
    await expect(tool.removedCountText).toHaveText("2 duplicates removed");
  });

  test("при включённом Case sensitive 'Apple' и 'apple' — разные строки", async () => {
    await tool.setInput("Apple\napple\nAPPLE\nbanana");
    await expect(tool.output).toHaveValue("Apple\napple\nAPPLE\nbanana");
    // Дубликатов нет — блок со счётчиком вообще не рендерится (removed > 0).
    await expect(tool.removedCountText).toBeHidden();
  });

  test("единственное число: '1 duplicate removed', а не '1 duplicates'", async () => {
    await tool.setInput("apple\napple\nbanana");
    await expect(tool.removedCountText).toHaveText("1 duplicate removed");
  });

  test("без повторов счётчик не показывается", async () => {
    await tool.setInput("apple\nbanana\ncherry");
    await expect(tool.removedCountText).toBeHidden();
  });
});
