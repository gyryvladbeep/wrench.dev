import { test, expect } from "@playwright/test";
import { ReadReceiptsCalculatorPage } from "./pages/ReadReceiptsCalculatorPage";

test.describe("read-receipts-calculator", () => {
  let tool: ReadReceiptsCalculatorPage;

  test.beforeEach(async ({ page }) => {
    tool = new ReadReceiptsCalculatorPage(page);
    await tool.goto();
  });

  test("образец: подписи статуса прочтения по сообщениям", async () => {
    await expect(tool.row(1)).toHaveAttribute("data-label", "Read by Bob, Chen and 1 other");
    await expect(tool.row(3)).toHaveAttribute("data-label", "Read by Bob and Eli");
    await expect(tool.row(5)).toHaveAttribute("data-label", "Read by Alice and Eli");
    await expect(tool.row(6)).toHaveAttribute("data-label", "Read by Eli");
  });

  test("указатель Eli: 9 дальше последнего сообщения 6 даёт пояснение", async () => {
    await expect(tool.note("pointer-beyond-last")).toBeVisible();
  });

  test("при 10 сообщениях пояснение исчезает", async () => {
    await tool.total.fill("10");

    await expect(tool.page.getByTestId("rr-notes")).toHaveCount(0);
  });

  test("показ одного имени превращает подпись в Bob and 2 others", async () => {
    await tool.names.fill("1");

    await expect(tool.row(1)).toHaveAttribute("data-label", "Read by Bob and 2 others");
  });

  test("без авторов показывается пустое состояние", async () => {
    await tool.authors.fill("");

    await expect(tool.empty).toBeVisible();
  });
});
