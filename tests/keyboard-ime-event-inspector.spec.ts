import { test, expect } from "@playwright/test";
import { KeyboardImeEventInspectorPage } from "./pages/KeyboardImeEventInspectorPage";

test.describe("Keyboard and IME Event Inspector", () => {
  let tool: KeyboardImeEventInspectorPage;

  test.beforeEach(async ({ page }) => {
    tool = new KeyboardImeEventInspectorPage(page);
    await tool.goto();
  });

  test("в начале журнал пуст и предупреждения нет", async () => {
    await expect(tool.count).toHaveText("Events: 0");
    await expect(tool.warning).toHaveCount(0);
  });

  test("ввод буквы a пишет keydown, beforeinput, input и keyup", async () => {
    await tool.field.click();
    await tool.page.keyboard.press("a");

    for (const type of ["keydown", "beforeinput", "input", "keyup"]) {
      await expect(tool.byType(type)).toHaveCount(1);
    }
    await expect(tool.byType("keydown").first()).toHaveAttribute("data-key", "a");
  });

  test("обычный Enter не вызывает предупреждения", async () => {
    await tool.field.click();
    await tool.page.keyboard.press("Enter");

    await expect(tool.byType("keydown").first()).toHaveAttribute("data-key", "Enter");
    await expect(tool.warning).toHaveCount(0);
  });

  test("Enter с isComposing=true показывает предупреждение про IME", async () => {
    await tool.field.click();
    await tool.dispatchKey("keydown", { key: "Enter", code: "Enter", isComposing: true });

    await expect(tool.warning).toBeVisible();
    await expect(tool.warning).toContainText("during composition");
  });

  test("Enter с keyCode 229 тоже считается нарушением", async () => {
    await tool.field.click();
    await tool.dispatchKey("keydown", { key: "Enter", code: "Enter", keyCode: 229 });

    await expect(tool.warning).toBeVisible();
  });

  test("события композиции попадают в журнал с данными", async () => {
    await tool.field.evaluate((el) => {
      el.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true, data: "" }));
      el.dispatchEvent(new CompositionEvent("compositionupdate", { bubbles: true, data: "に" }));
      el.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, data: "日本" }));
    });

    await expect(tool.byType("compositionstart")).toHaveCount(1);
    await expect(tool.byType("compositionupdate")).toContainText("に");
    await expect(tool.byType("compositionend")).toContainText("日本");
  });

  test("кнопка «Clear» очищает журнал и предупреждение", async () => {
    await tool.field.click();
    await tool.dispatchKey("keydown", { key: "Enter", isComposing: true });
    await tool.clear.click();

    await expect(tool.count).toHaveText("Events: 0");
    await expect(tool.warning).toHaveCount(0);
  });
});
