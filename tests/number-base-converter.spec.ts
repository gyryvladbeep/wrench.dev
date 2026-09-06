import { test, expect } from "@playwright/test";
import { NumberBaseConverterPage } from "./pages/NumberBaseConverterPage";

test.describe("Number Base Converter", () => {
  let tool: NumberBaseConverterPage;

  test.beforeEach(async ({ page }) => {
    tool = new NumberBaseConverterPage(page);
    await tool.goto();
  });

  test("по умолчанию 255 (decimal) корректно конвертируется во все системы счисления", async () => {
    await expect(tool.conversionValue(2)).toHaveText("0b11111111");
    await expect(tool.conversionValue(8)).toHaveText("0o377");
    await expect(tool.conversionValue(10)).toHaveText("255"); // Decimal без префикса
    await expect(tool.conversionValue(16)).toHaveText("0xFF");
  });

  test("битовый паттерн по умолчанию — 8 квадратиков, совпадающих с двоичным видом 255", async () => {
    await expect(tool.bitSquares).toHaveCount(8);
    const bits = await tool.bitSquares.allTextContents();
    expect(bits.join("")).toBe("11111111");
  });

  test("ввод в двоичной системе счисления даёт тот же результат, что и 255 в десятичной", async () => {
    await tool.setFromBase("Binary");
    await tool.setInput("11111111");

    await expect(tool.conversionValue(10)).toHaveText("255");
    await expect(tool.conversionValue(16)).toHaveText("0xFF");
  });

  test("невалидное число для выбранной системы счисления показывает ошибку", async () => {
    await tool.setFromBase("Binary");
    await tool.setInput("999"); // цифра 9 невалидна для base 2

    await expect(tool.errorMessage).toBeVisible();
  });

  test("пресет 65535 показывает корректный hex и все 16 бит", async () => {
    await tool.clickPreset(65535);

    await expect(tool.conversionValue(16)).toHaveText("0xFFFF");
    await expect(tool.bitSquares).toHaveCount(16);
  });

  test("пресет 16777215 (> 0xFFFF) скрывает битовый паттерн", async () => {
    await tool.clickPreset(16777215);

    await expect(tool.conversionValue(16)).toHaveText("0xFFFFFF");
    await expect(tool.bitSquares).toHaveCount(0);
  });
});
