import { test, expect } from "@playwright/test";
import { MessageGroupingCalculatorPage } from "./pages/MessageGroupingCalculatorPage";

test.describe("message-grouping-calculator", () => {
  let tool: MessageGroupingCalculatorPage;

  test.beforeEach(async ({ page }) => {
    tool = new MessageGroupingCalculatorPage(page);
    await tool.goto();
  });

  test("образец: 7 сообщений, 6 групп, 2 разделителя дней", async () => {
    await expect(tool.stat("mg-messages")).toHaveText("7");
    await expect(tool.stat("mg-groups")).toHaveText("6");
    await expect(tool.stat("mg-days")).toHaveText("2");
    await expect(tool.stat("mg-skipped")).toHaveText("0");
  });

  test("образец содержит один разделитель непрочитанного, всего 9 блоков", async () => {
    await expect(tool.kind("unread")).toHaveCount(1);
    await expect(tool.kind("day")).toHaveCount(2);
    await expect(tool.blocks).toHaveCount(9);
  });

  test("окно 0 минут делает каждое сообщение отдельной группой", async () => {
    await tool.windowMin.fill("0");

    await expect(tool.stat("mg-groups")).toHaveText("7");
  });

  test("часовой пояс Asia/Tokyo сливает группы: 5 групп и 2 дня", async () => {
    await tool.zone.selectOption("Asia/Tokyo");

    await expect(tool.stat("mg-groups")).toHaveText("5");
    await expect(tool.stat("mg-days")).toHaveText("2");
  });

  test("без номера последнего прочитанного разделителя непрочитанного нет", async () => {
    await tool.lastRead.fill("");

    await expect(tool.kind("unread")).toHaveCount(0);
  });

  test("невалидный JSON показывает ошибку", async () => {
    await tool.events.fill("[{");

    await expect(tool.error).toBeVisible();
  });
});
