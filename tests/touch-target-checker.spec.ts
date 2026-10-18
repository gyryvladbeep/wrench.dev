import { test, expect } from "@playwright/test";
import { TouchTargetCheckerPage } from "./pages/TouchTargetCheckerPage";

test.describe("Touch Target Size Checker", () => {
  let tool: TouchTargetCheckerPage;

  test.beforeEach(async ({ page }) => {
    tool = new TouchTargetCheckerPage(page);
    await tool.goto();
  });

  test("40x40 по умолчанию: проходит только WCAG 2.2 AA, остальные правила не проходят", async () => {
    await expect(tool.rule("apple")).toHaveAttribute("data-pass", "false");
    await expect(tool.rule("material")).toHaveAttribute("data-pass", "false");
    await expect(tool.rule("wcag-aa")).toHaveAttribute("data-pass", "true");
    await expect(tool.rule("wcag-aaa")).toHaveAttribute("data-pass", "false");
  });

  test("для Material подсказка называет нужный отступ: 4 с каждой стороны", async () => {
    await expect(tool.rule("material")).toContainText("add 4 padding");
    await expect(tool.rule("material")).toContainText("short by 8");
  });

  test("48x48 проходит все четыре правила", async () => {
    await tool.setSize(48, 48, 8);

    for (const id of ["apple", "material", "wcag-aa", "wcag-aaa"] as const) {
      await expect(tool.rule(id)).toHaveAttribute("data-pass", "true");
    }
  });

  test("44x44 проходит Apple, но не Material", async () => {
    await tool.setSize(44, 44, 8);

    await expect(tool.rule("apple")).toHaveAttribute("data-pass", "true");
    await expect(tool.rule("material")).toHaveAttribute("data-pass", "false");
  });

  test("20x20 с достаточным расстоянием проходит WCAG AA по исключению, без расстояния - нет", async () => {
    await tool.setSize(20, 20, 4);
    await expect(tool.rule("wcag-aa")).toHaveAttribute("data-pass", "true");
    await expect(tool.rule("wcag-aa")).toContainText("Passes by spacing");

    await tool.gapInput.fill("2");
    await expect(tool.rule("wcag-aa")).toHaveAttribute("data-pass", "false");
  });

  test("проверяется меньшая сторона: 100x30 не проходит Apple", async () => {
    await tool.setSize(100, 30, 8);

    await expect(tool.rule("apple")).toHaveAttribute("data-pass", "false");
    await expect(tool.rule("apple")).toContainText("short by 14");
  });

  test("физические пиксели переводятся в логические по масштабу плотности", async () => {
    await tool.unitSelect.selectOption("px");
    await tool.scaleInput.fill("3");
    await tool.setSize(144, 144, 24);

    await expect(tool.summary).toContainText("48 × 48");
    await expect(tool.rule("material")).toHaveAttribute("data-pass", "true");
  });

  test("нулевой размер показывает подсказку вместо таблицы", async () => {
    await tool.widthInput.fill("0");

    await expect(tool.invalid).toBeVisible();
    await expect(tool.rule("apple")).toHaveCount(0);
  });
});
