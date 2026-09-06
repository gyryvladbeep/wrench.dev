import { test, expect } from "@playwright/test";
import { RemoveEmptyLinesPage } from "./pages/RemoveEmptyLinesPage";

test.describe("Remove Empty Lines", () => {
  let tool: RemoveEmptyLinesPage;

  test.beforeEach(async ({ page }) => {
    tool = new RemoveEmptyLinesPage(page);
    await tool.goto();
  });

  test("по умолчанию убирает пустые строки из примера текста", async () => {
    await expect(tool.trimWhitespaceCheckbox).toBeChecked();
    await expect(tool.output).toHaveValue("apple\nbanana\ncherry\ndate");
    await expect(tool.removedCountText).toHaveText("4 lines removed");
  });

  test("по умолчанию строка из одних пробелов тоже считается пустой", async () => {
    // "   " не строго "" — отличить эти два случая друг от друга и
    // проверяет следующий тест (с выключенным чекбоксом).
    await tool.setInput("apple\n   \nbanana\n\ncherry");
    await expect(tool.output).toHaveValue("apple\nbanana\ncherry");
    await expect(tool.removedCountText).toHaveText("2 lines removed");
  });

  test("с выключенным чекбоксом строка из пробелов больше не считается пустой", async () => {
    await tool.trimWhitespaceCheckbox.uncheck();
    await tool.setInput("apple\n   \nbanana\n\ncherry");
    // Убирается только строго "" — "   " остаётся как есть.
    await expect(tool.output).toHaveValue("apple\n   \nbanana\ncherry");
    await expect(tool.removedCountText).toHaveText("1 line removed");
  });

  test("без пустых строк счётчик не показывается", async () => {
    await tool.setInput("apple\nbanana\ncherry");
    await expect(tool.removedCountText).toBeHidden();
  });
});
