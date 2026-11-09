import { test, expect } from "@playwright/test";
import { PluralFormsCheckerPage } from "./pages/PluralFormsCheckerPage";

test.describe("plural-forms-checker", () => {
  let tool: PluralFormsCheckerPage;

  test.beforeEach(async ({ page }) => {
    tool = new PluralFormsCheckerPage(page);
    await tool.goto();
  });

  test("русский: 1 one, 2 few, 5 many, 11 many, 21 one, 22 few, 0 many", async () => {
    const expected: Record<number, string> = { 0: "many", 1: "one", 2: "few", 5: "many", 11: "many", 21: "one", 22: "few" };
    await tool.numbers.fill("0, 1, 2, 5, 11, 21, 22");

    for (const [n, category] of Object.entries(expected)) {
      await expect(tool.row(Number(n))).toHaveAttribute("data-category", category);
    }
  });

  test("русский: категории few, many, one, other", async () => {
    for (const c of ["few", "many", "one", "other"]) {
      await expect(tool.categories).toContainText(c);
    }
  });

  test("диапазоны русского: 2-4 few, 5-20 many, 22-24 few, 25-30 many", async () => {
    await expect(tool.range(0, 0)).toHaveAttribute("data-category", "many");
    await expect(tool.range(2, 4)).toHaveAttribute("data-category", "few");
    await expect(tool.range(5, 20)).toHaveAttribute("data-category", "many");
    await expect(tool.range(22, 24)).toHaveAttribute("data-category", "few");
    await expect(tool.range(25, 30)).toHaveAttribute("data-category", "many");
  });

  test("английский: только one и other, диапазон 2-120 other", async () => {
    await tool.locale.selectOption("en");

    await expect(tool.categories).toContainText("one, other");
    await expect(tool.range(2, 120)).toHaveAttribute("data-category", "other");
  });

  test("если оставить один шаблон, перечислены недостающие категории", async () => {
    await tool.templates.fill("one: {n} a");

    await expect(tool.missing).toContainText("few");
    await expect(tool.missing).toContainText("many");
    await expect(tool.row(5)).toHaveAttribute("data-missing", "true");
  });

  test("японский: единственная категория other", async () => {
    await tool.locale.selectOption("ja");

    await expect(tool.categories).toContainText("other");
    await expect(tool.categories).not.toContainText("one");
  });
});
