import { test, expect } from "@playwright/test";
import { MessageSendStatusValidatorPage } from "./pages/MessageSendStatusValidatorPage";

test.describe("message-send-status-validator", () => {
  let tool: MessageSendStatusValidatorPage;

  test.beforeEach(async ({ page }) => {
    tool = new MessageSendStatusValidatorPage(page);
    await tool.goto();
  });

  test("образец: 4 сообщения и 3 проблемы", async () => {
    await expect(tool.stat("ss-count")).toHaveText("4");
    await expect(tool.stat("ss-issues")).toHaveText("3");
    await expect(tool.messages).toHaveCount(4);
  });

  test("образец содержит недопустимые переходы и зависание", async () => {
    await expect(tool.finding("illegal-transition")).toBeVisible();
    await expect(tool.finding("stuck")).toBeVisible();
  });

  test("порог зависания 120000 мс убирает замечание stuck", async () => {
    await tool.stuck.fill("120000");

    await expect(tool.page.getByTestId("ss-findings").locator('[data-code="stuck"]')).toHaveCount(0);
    await expect(tool.stat("ss-issues")).toHaveText("2");
  });

  test("чистая цепочка draft, sending, sent даёт ok", async () => {
    await tool.events.fill(
      '[{"id":"x","status":"draft","ts":"2026-01-01T00:00:00Z"},{"id":"x","status":"sending","ts":"2026-01-01T00:00:01Z"},{"id":"x","status":"sent","ts":"2026-01-01T00:00:02Z"}]'
    );

    await expect(tool.finding("ok")).toBeVisible();
    await expect(tool.stat("ss-issues")).toHaveText("0");
  });

  test("таблица допустимых переходов раскрывается", async ({ page }) => {
    await page.getByText("Allowed transitions").click();

    await expect(page.getByTestId("ss-transitions")).toBeVisible();
  });

  test("невалидный JSON показывает ошибку", async () => {
    await tool.events.fill("[1,");

    await expect(tool.error).toBeVisible();
  });
});
