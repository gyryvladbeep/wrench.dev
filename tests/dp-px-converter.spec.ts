import { test, expect } from "@playwright/test";
import { DpPxConverterPage } from "./pages/DpPxConverterPage";

test.describe("dp / px / pt Converter", () => {
  let tool: DpPxConverterPage;

  test.beforeEach(async ({ page }) => {
    tool = new DpPxConverterPage(page);
    await tool.goto();
  });

  test("48 dp по умолчанию даёт верные пиксели для всех корзин Android", async () => {
    await expect(tool.pixels("ldpi")).toHaveText("36 px");
    await expect(tool.pixels("mdpi")).toHaveText("48 px");
    await expect(tool.pixels("hdpi")).toHaveText("72 px");
    await expect(tool.pixels("xhdpi")).toHaveText("96 px");
    await expect(tool.pixels("xxhdpi")).toHaveText("144 px");
    await expect(tool.pixels("xxxhdpi")).toHaveText("192 px");
  });

  test("48 pt по умолчанию даёт верные пиксели для @1x, @2x и @3x на iOS", async () => {
    await expect(tool.pixels("ios1x")).toHaveText("48 px");
    await expect(tool.pixels("ios2x")).toHaveText("96 px");
    await expect(tool.pixels("ios3x")).toHaveText("144 px");
  });

  test("дробное значение dp пересчитывается и округляется до двух знаков", async () => {
    await tool.dpInput.fill("10.5");

    await expect(tool.pixels("hdpi")).toHaveText("15.75 px");
    await expect(tool.pixels("xxhdpi")).toHaveText("31.5 px");
  });

  test("обратный пересчёт: 144 px на xxhdpi это ровно 48 dp", async () => {
    await expect(tool.dpResult).toHaveText("48 dp");
  });

  test("для iOS-масштаба результат подписан pt", async () => {
    await tool.bucketSelect.selectOption("ios3x");

    await expect(tool.dpResult).toHaveText("48 pt");
  });

  test("смена плотности и пикселей пересчитывает результат", async () => {
    await tool.pxInput.fill("100");
    await tool.bucketSelect.selectOption("xhdpi");

    await expect(tool.dpResult).toHaveText("50 dp");
  });
});
