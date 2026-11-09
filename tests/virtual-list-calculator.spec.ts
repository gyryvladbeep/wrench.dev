import { test, expect } from "@playwright/test";
import { VirtualListCalculatorPage } from "./pages/VirtualListCalculatorPage";

test.describe("virtual-list-calculator", () => {
  let tool: VirtualListCalculatorPage;

  test.beforeEach(async ({ page }) => {
    tool = new VirtualListCalculatorPage(page);
    await tool.goto();
  });

  test("образец: видимые строки 50-59, в DOM 20 узлов", async () => {
    await expect(tool.stat("vl-first")).toHaveText("50");
    await expect(tool.stat("vl-last")).toHaveText("59");
    await expect(tool.stat("vl-range")).toHaveText("45-64");
    await expect(tool.stat("vl-rendered")).toHaveText("20");
  });

  test("полная высота 600000 px и максимум прокрутки 599400", async () => {
    await expect(tool.stat("vl-total")).toHaveText("600000");
    await expect(tool.stat("vl-max")).toHaveText("599400");
  });

  test("переход к строке 100 по центру даёт scrollTop = 5730", async () => {
    await expect(tool.jumpResult).toContainText("5730");
  });

  test("выравнивание start даёт 6000", async () => {
    await tool.align.selectOption("start");

    await expect(tool.jumpResult).toContainText("6000");
  });

  test("подгрузка 50 строк сверху при прокрутке 120 требует scrollTop 3120", async () => {
    await tool.scroll.fill("120");

    await expect(tool.prependResult).toContainText("3120");
  });

  test("вердикт: 10000 узлов в DOM значит список не виртуализирован", async () => {
    await tool.observed.fill("10000");

    await expect(tool.verdict).toHaveAttribute("data-verdict", "not-virtualized");
  });

  test("вердикт: 40 узлов вместо 20 - слишком много, 5 - слишком мало, 20 - норма", async () => {
    await tool.observed.fill("40");
    await expect(tool.verdict).toHaveAttribute("data-verdict", "too-many");
    await tool.observed.fill("5");
    await expect(tool.verdict).toHaveAttribute("data-verdict", "too-few");
    await tool.observed.fill("20");
    await expect(tool.verdict).toHaveAttribute("data-verdict", "ok");
  });

  test("нулевая высота строки показывает подсказку вместо расчёта", async () => {
    await tool.height.fill("0");

    await expect(tool.invalid).toBeVisible();
  });
});
