import { test, expect } from "@playwright/test";
import { QrCodeGeneratorPage } from "./pages/QrCodeGeneratorPage";

test.describe("QR Code Generator", () => {
  let tool: QrCodeGeneratorPage;

  test.beforeEach(async ({ page }) => {
    tool = new QrCodeGeneratorPage(page);
    await tool.goto();
    // Ждём первой отрисовки canvas (QRCode.toCanvas асинхронный).
    await expect(tool.canvas).toBeVisible();
    await expect.poll(async () => (await tool.canvasSize()).width).toBeGreaterThan(0);
  });

  test("по умолчанию рендерится непустой canvas для дефолтного URL", async () => {
    const { width, height } = await tool.canvasSize();
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
    await expect(tool.errorText).toHaveCount(0);
  });

  test("изменение размера (слайдер) меняет размеры canvas", async () => {
    const before = await tool.canvasSize();

    await tool.sizeSlider.fill("600");
    await tool.sizeSlider.dispatchEvent("input");
    await tool.sizeSlider.dispatchEvent("change");

    await expect.poll(async () => (await tool.canvasSize()).width).not.toBe(before.width);
    const after = await tool.canvasSize();
    expect(after.width).toBeGreaterThan(before.width);
  });

  test("смена уровня коррекции ошибок перерисовывает QR-код (другой рисунок)", async () => {
    const before = await tool.canvasDataUrl();

    await tool.ecButton("H").click();

    await expect.poll(async () => tool.canvasDataUrl()).not.toBe(before);
  });

  test("смена содержимого перерисовывает QR-код", async () => {
    const before = await tool.canvasDataUrl();

    await tool.setInput("completely different content for the qr code");

    await expect.poll(async () => tool.canvasDataUrl()).not.toBe(before);
  });

  test("слишком длинный ввод превышает ёмкость QR-кода — показывается текст ошибки вместо canvas", async () => {
    // Ёмкость QR (версия 40, самый низкий уровень коррекции) — около
    // 7089 цифр / ~4296 буквенно-цифровых символов; строка length 6000
    // с разнообразными символами гарантированно превышает лимит.
    const huge = "x".repeat(6000);
    await tool.setInput(huge);

    await expect(tool.errorText).toBeVisible({ timeout: 5000 });
    await expect(tool.canvas).toBeHidden();
  });

  test("кнопка Download PNG скачивает qrcode.png", async () => {
    const [download] = await Promise.all([
      tool.page.waitForEvent("download"),
      tool.pngButton.click(),
    ]);
    expect(download.suggestedFilename()).toBe("qrcode.png");
  });

  test("кнопка Download SVG скачивает qrcode.svg", async () => {
    const [download] = await Promise.all([
      tool.page.waitForEvent("download"),
      tool.svgButton.click(),
    ]);
    expect(download.suggestedFilename()).toBe("qrcode.svg");
  });
});
