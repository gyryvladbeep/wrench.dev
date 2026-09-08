import { test, expect } from "@playwright/test";
import { FramerateMovementCalculatorPage } from "./pages/FramerateMovementCalculatorPage";

test.describe("Framerate-Independent Movement Calculator", () => {
  let tool: FramerateMovementCalculatorPage;

  test.beforeEach(async ({ page }) => {
    tool = new FramerateMovementCalculatorPage(page);
    await tool.goto();
  });

  test("значения по умолчанию (speed=2 @60fps) дают 120/сек и верный пересчёт по FPS", async () => {
    await expect(tool.perSecondResult).toHaveText("120.00 /sec");
    await expect(tool.perFrameSpeed(30)).toHaveText("4.0000");
    await expect(tool.perFrameSpeed(60)).toHaveText("2.0000");
    await expect(tool.perFrameSpeed(144)).toHaveText("0.8333");
  });

  test("смена скорости и FPS настройки пересчитывает perSecond и таблицу", async () => {
    await tool.setSpeed(5, 30);

    // perSecond = 5 * 30 = 150
    await expect(tool.perSecondResult).toHaveText("150.00 /sec");
    await expect(tool.perFrameSpeed(60)).toHaveText("2.5000");
  });

  test("half-life по умолчанию (0.15с) даёт корректные коэффициенты сглаживания по FPS", async () => {
    await expect(tool.lerpFactor(30)).toHaveText("0.1428");
    await expect(tool.lerpFactor(60)).toHaveText("0.0741");
    await expect(tool.lerpFactor(144)).toHaveText("0.0316");
  });

  test("изменение half-life пересчитывает коэффициент сглаживания", async () => {
    await tool.setHalfLife(0.3);

    await expect(tool.lerpFactor(60)).toHaveText("0.0378");
  });
});
