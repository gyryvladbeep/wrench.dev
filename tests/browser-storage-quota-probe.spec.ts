import { test, expect } from "@playwright/test";
import { BrowserStorageQuotaProbePage } from "./pages/BrowserStorageQuotaProbePage";

test.describe("browser-storage-quota-probe", () => {
  let tool: BrowserStorageQuotaProbePage;

  test.beforeEach(async ({ page }) => {
    tool = new BrowserStorageQuotaProbePage(page);
    await tool.goto();
  });

  test("оценка StorageManager показана или объяснено, почему её нет", async () => {
    await expect(tool.estimate).toBeVisible();
  });

  test("замер localStorage находит больше миллиона символов и убирает за собой ключ", async ({ page }) => {
    await tool.localBtn.click();

    await expect
      .poll(async () => Number((await tool.local.getAttribute("data-chars")) || 0), { timeout: 60_000 })
      .toBeGreaterThan(1_000_000);
    expect(await page.evaluate(() => localStorage.getItem("__wrench_quota_probe__"))).toBeNull();
  });

  test("замер sessionStorage находит больше миллиона символов и убирает за собой ключ", async ({ page }) => {
    await tool.sessionBtn.click();

    await expect
      .poll(async () => Number((await tool.session.getAttribute("data-chars")) || 0), { timeout: 60_000 })
      .toBeGreaterThan(1_000_000);
    expect(await page.evaluate(() => sessionStorage.getItem("__wrench_quota_probe__"))).toBeNull();
  });

  test("кнопка обновления оценки остаётся доступной", async () => {
    await tool.estimateBtn.click();

    await expect(tool.estimate).toBeVisible();
  });
});
