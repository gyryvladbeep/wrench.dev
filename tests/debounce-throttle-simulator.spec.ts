import { test, expect } from "@playwright/test";
import { DebounceThrottleSimulatorPage } from "./pages/DebounceThrottleSimulatorPage";

test.describe("Debounce and Throttle Simulator", () => {
  let tool: DebounceThrottleSimulatorPage;

  test.beforeEach(async ({ page }) => {
    tool = new DebounceThrottleSimulatorPage(page);
    await tool.goto();
  });

  test("debounce 300 мс по умолчанию: 7 событий дают 3 вызова на 540, 1250 и 2100 мс", async () => {
    await expect(tool.stat("events-count")).toHaveText("7");
    await expect(tool.stat("fires-count")).toHaveText("3");
    await expect(tool.stat("saved")).toHaveText("4");
    await expect(tool.fires.nth(0)).toHaveAttribute("data-at", "540");
    await expect(tool.fires.nth(1)).toHaveAttribute("data-at", "1250");
    await expect(tool.fires.nth(2)).toHaveAttribute("data-at", "2100");
    await expect(tool.fires.nth(0)).toHaveAttribute("data-edge", "trailing");
  });

  test("throttle с обоими фронтами: 5 вызовов, первый сразу в нулевой момент", async () => {
    await tool.mode.selectOption("throttle");
    await tool.leading.check();

    await expect(tool.fires).toHaveCount(5);
    await expect(tool.fires.first()).toHaveAttribute("data-at", "0");
    await expect(tool.fires.first()).toHaveAttribute("data-edge", "leading");
  });

  test("debounce только с ведущим фронтом вызывает обработчик один раз на серию", async () => {
    await tool.leading.check();
    await tool.trailing.uncheck();

    await expect(tool.fires).toHaveCount(3);
    await expect(tool.fires.first()).toHaveAttribute("data-edge", "leading");
    await expect(tool.fires.first()).toHaveAttribute("data-at", "0");
  });

  test("без обоих фронтов вызовов нет и показано сообщение", async () => {
    await tool.trailing.uncheck();

    await expect(tool.fires).toHaveCount(0);
    await expect(tool.page.getByTestId("td-fires")).toContainText("No calls");
  });

  test("запятые, пробелы и переносы строк разделяют моменты одинаково", async () => {
    await tool.events.fill("0\n100 200,300");

    await expect(tool.stat("events-count")).toHaveText("4");
  });
});
