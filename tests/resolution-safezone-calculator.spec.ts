import { test, expect } from "@playwright/test";
import { ResolutionSafezoneCalculatorPage } from "./pages/ResolutionSafezoneCalculatorPage";

test.describe("Resolution & Safe Zone Calculator", () => {
  let tool: ResolutionSafezoneCalculatorPage;

  test.beforeEach(async ({ page }) => {
    tool = new ResolutionSafezoneCalculatorPage(page);
    await tool.goto();
  });

  test("значения по умолчанию (1920 ширина, 5% отступ) верно считают Desktop 16:9", async () => {
    // Первая строка по умолчанию — Desktop 16:9
    await expect(tool.frameText(0)).toHaveText("Frame: 1920×1080");
    await expect(tool.safeZoneText(0)).toHaveText("Safe zone: 1728×972");
    await expect(tool.insetText(0)).toHaveText("Inset: 96×54px");
  });

  test("Mobile Portrait 9:16 (4-я строка по умолчанию) даёт вытянутый кадр", async () => {
    await expect(tool.frameText(3)).toHaveText("Frame: 1920×3413");
    await expect(tool.safeZoneText(3)).toHaveText("Safe zone: 1728×3072");
    await expect(tool.insetText(3)).toHaveText("Inset: 96×171px");
  });

  test("смена базовой ширины пересчитывает все строки", async () => {
    await tool.setRefWidth(1280);

    // Desktop 16:9 при ширине 1280 -> высота 720
    await expect(tool.frameText(0)).toHaveText("Frame: 1280×720");
  });

  test("смена отступа safe zone пересчитывает safe zone и inset", async () => {
    await tool.setMargin(10);

    // Desktop 16:9: safeW=1920*0.8=1536, safeH=1080*0.8=864, inset=192x108
    await expect(tool.safeZoneText(0)).toHaveText("Safe zone: 1536×864");
    await expect(tool.insetText(0)).toHaveText("Inset: 192×108px");
  });

  test("добавление и удаление соотношения меняет число строк", async () => {
    await expect(tool.rowContainers).toHaveCount(6);

    await tool.addRatioButton.click();
    await expect(tool.rowContainers).toHaveCount(7);

    await tool.removeButton(0).click();
    await expect(tool.rowContainers).toHaveCount(6);
  });
});
