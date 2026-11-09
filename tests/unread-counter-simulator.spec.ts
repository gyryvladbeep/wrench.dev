import { test, expect } from "@playwright/test";
import { UnreadCounterSimulatorPage } from "./pages/UnreadCounterSimulatorPage";

test.describe("unread-counter-simulator", () => {
  let tool: UnreadCounterSimulatorPage;

  test.beforeEach(async ({ page }) => {
    tool = new UnreadCounterSimulatorPage(page);
    await tool.goto();
  });

  test("образец: 9 шагов, итог 0 и бейдж пуст", async () => {
    await expect(tool.steps).toHaveCount(9);
    await expect(tool.stat("uc-total")).toHaveText("0");
    await expect(tool.stat("uc-badge")).toHaveText("-");
  });

  test("после каждого события ожидаемые суммы 1,2,3,3,2,2,1,0,0", async () => {
    const totals = await tool.steps.evaluateAll((rows) => rows.map((r) => r.getAttribute("data-total")));
    expect(totals).toEqual(["1", "2", "3", "3", "2", "2", "1", "0", "0"]);
  });

  test("заглушённый канал dev держит 2 непрочитанных, но не входит в бейдж", async () => {
    await expect(tool.channel("dev")).toHaveAttribute("data-unread", "2");
    await expect(tool.channel("dev")).toHaveAttribute("data-muted", "true");
    await expect(tool.channel("general")).toHaveAttribute("data-unread", "0");
  });

  test("с галочкой про заглушённые каналы итог становится 2", async () => {
    await tool.muted.check();

    await expect(tool.stat("uc-total")).toHaveText("2");
    await expect(tool.stat("uc-badge")).toHaveText("2");
  });

  test("предел бейджа 2 превращает третий шаг в 2+", async () => {
    await tool.cap.fill("2");

    await expect(tool.steps.nth(2)).toHaveAttribute("data-badge", "2+");
    await expect(tool.steps.nth(0)).toHaveAttribute("data-badge", "1");
  });

  test("откат указателя прочтения назад даёт пояснение", async () => {
    await expect(tool.page.getByTestId("uc-notes")).toContainText("only moves forward");
  });

  test("невалидный JSON показывает ошибку", async () => {
    await tool.events.fill("{not json");

    await expect(tool.error).toBeVisible();
  });
});
