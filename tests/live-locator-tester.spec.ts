import { test, expect } from "@playwright/test";
import { LiveLocatorTesterPage } from "./pages/LiveLocatorTesterPage";

test.describe("Live Locator Tester", () => {
  let tool: LiveLocatorTesterPage;

  test.beforeEach(async ({ page }) => {
    tool = new LiveLocatorTesterPage(page);
    await tool.goto();
  });

  test("значения по умолчанию: селектор '.btn-primary' находит 2 кнопки и показывает предупреждение о неуникальности", async () => {
    await expect(tool.matchCountBadge()).toHaveText("2");
    await expect(tool.matchedElementCards()).toHaveCount(2);
    await expect(tool.page.getByText(/more than one match/i)).toBeVisible();
  });

  test("уникальный ID-селектор находит ровно один элемент, без предупреждения о неуникальности", async () => {
    await tool.setSelector("#submit-btn");
    await expect(tool.matchCountBadge()).toHaveText("1");
    await expect(tool.matchedElementCards()).toHaveCount(1);
    await expect(tool.page.getByText(/more than one match/i)).toBeHidden();
  });

  test("несуществующий селектор даёт 0 совпадений и предупреждение", async () => {
    await tool.setSelector(".does-not-exist");
    await expect(tool.matchCountBadge()).toHaveText("0");
    // Подстрока уникальна для подсказки под полем — тот же оборот "won't find
    // the element" встречается и в howToSteps этого инструмента ниже на странице.
    await expect(tool.page.getByText("in a real test. Check for typos")).toBeVisible();
  });

  test("переключение на XPath и валидное XPath-выражение находит тот же элемент", async () => {
    await tool.switchToXPath();
    await tool.setSelector("//button[@id='submit-btn']");
    await expect(tool.matchCountBadge()).toHaveText("1");
  });

  test("невалидный CSS-селектор показывает ошибку, не ломая страницу", async () => {
    await tool.setSelector(".unterminated[");
    await expect(tool.errorMessage()).toBeVisible();
  });

  test("изменение HTML пересчитывает совпадения для того же селектора", async () => {
    await tool.setSelector(".btn-primary");
    await expect(tool.matchCountBadge()).toHaveText("2");

    await tool.setHtml('<button class="btn-primary">Only one now</button>');
    await expect(tool.matchCountBadge()).toHaveText("1");
  });
});
