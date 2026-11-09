import { test, expect } from "@playwright/test";
import { ChatScenarioMatrixGeneratorPage } from "./pages/ChatScenarioMatrixGeneratorPage";

test.describe("chat-scenario-matrix-generator", () => {
  let tool: ChatScenarioMatrixGeneratorPage;

  test.beforeEach(async ({ page }) => {
    tool = new ChatScenarioMatrixGeneratorPage(page);
    await tool.goto();
  });

  test("образец: 700 полных комбинаций, 38 строк pairwise, 0 непокрытых пар", async () => {
    await expect(tool.stat("sx-full")).toHaveText("700");
    await expect(tool.stat("sx-count")).toHaveText("38");
    await expect(tool.stat("sx-missing")).toHaveText("0");
  });

  test("полный перебор даёт 700 строк", async () => {
    await tool.strategy.selectOption("full");

    await expect(tool.stat("sx-count")).toHaveText("700");
  });

  test("два измерения по два значения дают 4 строки", async () => {
    await tool.dims.fill("A: 1, 2\nB: x, y");

    await expect(tool.stat("sx-full")).toHaveText("4");
    await expect(tool.stat("sx-count")).toHaveText("4");
    await expect(tool.stat("sx-missing")).toHaveText("0");
  });

  test("одно измерение даёт ошибку", async () => {
    await tool.dims.fill("A: 1");

    await expect(tool.errors).toContainText("at least two dimensions");
  });

  test("CSV скачивается под именем chat-scenarios.csv", async ({ page }) => {
    const [download] = await Promise.all([page.waitForEvent("download"), tool.csv.click()]);

    expect(download.suggestedFilename()).toBe("chat-scenarios.csv");
  });
});
