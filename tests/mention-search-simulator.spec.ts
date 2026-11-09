import { test, expect } from "@playwright/test";
import { MentionSearchSimulatorPage } from "./pages/MentionSearchSimulatorPage";

test.describe("mention-search-simulator", () => {
  let tool: MentionSearchSimulatorPage;

  test.beforeEach(async ({ page }) => {
    tool = new MentionSearchSimulatorPage(page);
    await tool.goto();
  });

  test("запрос в чужой раскладке находит alice с оценкой 95", async () => {
    await expect(tool.rows).toHaveCount(1);
    await expect(tool.rows.first()).toHaveAttribute("data-username", "alice");
    await expect(tool.rows.first()).toHaveAttribute("data-via", "layout");
    await expect(tool.rows.first()).toHaveAttribute("data-score", "95");
  });

  test("запрос al находит alice и alina.k по префиксу логина", async () => {
    await tool.query.fill("al");

    await expect(tool.rows).toHaveCount(2);
    await expect(tool.rows.first()).toHaveAttribute("data-reason", "username-prefix");
    await expect(tool.page.locator('tr[data-username="alina.k"]')).toBeVisible();
  });

  test("кириллическое имя Алина находит alina.k", async () => {
    await tool.query.fill("алина");

    await expect(tool.rows).toHaveCount(1);
    await expect(tool.rows.first()).toHaveAttribute("data-username", "alina.k");
  });

  test("регистр и диакритика не мешают: JOSE находит jose", async () => {
    await tool.query.fill("JOSE");

    await expect(tool.page.locator('tr[data-username="jose"]')).toBeVisible();
  });

  test("запрос без совпадений показывает пустой результат", async () => {
    await tool.query.fill("qqqq");

    await expect(tool.empty).toBeVisible();
  });
});
