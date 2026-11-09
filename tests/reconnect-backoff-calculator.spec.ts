import { test, expect } from "@playwright/test";
import { ReconnectBackoffCalculatorPage } from "./pages/ReconnectBackoffCalculatorPage";

test.describe("Reconnect Backoff Calculator", () => {
  let tool: ReconnectBackoffCalculatorPage;

  test.beforeEach(async ({ page }) => {
    tool = new ReconnectBackoffCalculatorPage(page);
    await tool.goto();
  });

  test("по умолчанию 8 попыток: 1, 2, 4, 8, 16, затем максимум 30 с", async () => {
    await expect(tool.rows).toHaveCount(8);
    for (const [attempt, nominal] of [[1, 1000], [2, 2000], [3, 4000], [4, 8000], [5, 16000], [6, 30000]]) {
      await expect(tool.row(attempt)).toHaveAttribute("data-nominal", String(nominal));
    }
  });

  test("упирается в максимум с шестой попытки", async () => {
    await expect(tool.stat("capped")).toHaveText("6");
    await expect(tool.row(5)).toHaveAttribute("data-capped", "false");
    await expect(tool.row(6)).toHaveAttribute("data-capped", "true");
  });

  test("максимум 5000 мс срабатывает уже на четвёртой попытке", async () => {
    await tool.max.fill("5000");

    await expect(tool.stat("capped")).toHaveText("4");
    await expect(tool.row(4)).toHaveAttribute("data-nominal", "5000");
  });

  test("без jitter лучший и худший случай совпадают", async () => {
    await expect(tool.stat("total-max")).toHaveText(await tool.stat("total-min").innerText());
  });

  test("full jitter: диапазон первой попытки от 0 до 1 с", async () => {
    await tool.jitter.selectOption("full");

    await expect(tool.row(1)).toContainText("0 ms - 1 s");
  });

  test("тот же seed даёт тот же пример, другой seed — другой", async () => {
    await tool.jitter.selectOption("full");
    const first = await tool.row(3).innerText();
    await tool.seed.fill("99");
    const other = await tool.row(3).innerText();
    await tool.seed.fill("1");

    expect(other).not.toBe(first);
    expect(await tool.row(3).innerText()).toBe(first);
  });

  test("множитель меньше 1 показывает сообщение об ошибке и скрывает таблицу", async () => {
    await tool.factor.fill("0.5");

    await expect(tool.invalid).toBeVisible();
    await expect(tool.rows).toHaveCount(0);
  });

  test("число попыток больше 50 ограничивается 50", async () => {
    await tool.attempts.fill("80");

    await expect(tool.rows).toHaveCount(50);
  });
});
