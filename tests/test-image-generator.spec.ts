import { test, expect } from "@playwright/test";
import { TestImageGeneratorPage } from "./pages/TestImageGeneratorPage";

test.describe("Test Image Generator", () => {
  let tool: TestImageGeneratorPage;

  test.beforeEach(async ({ page }) => {
    tool = new TestImageGeneratorPage(page);
    await tool.goto();
  });

  test("по умолчанию 1920 на 1080, 2.07 мегапикселя", async () => {
    await expect(tool.info).toContainText("1920 x 1080 px");
    await expect(tool.info).toContainText("2.07 MP");
  });

  test("образец 1x1 скачивается как PNG с размерами 1 на 1 в заголовке IHDR", async () => {
    await tool.preset("1x1").click();
    const file = await tool.download();

    expect(file.name).toBe("test-image-1x1.png");
    expect([...file.data.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(file.data.readUInt32BE(16)).toBe(1);
    expect(file.data.readUInt32BE(20)).toBe(1);
  });

  test("произвольные 300 на 120 попадают в IHDR без искажений", async () => {
    await tool.width.fill("300");
    await tool.height.fill("120");
    const file = await tool.download();

    expect(file.data.readUInt32BE(16)).toBe(300);
    expect(file.data.readUInt32BE(20)).toBe(120);
  });

  test("формат JPEG: расширение jpg и сигнатура FF D8", async () => {
    await tool.width.fill("64");
    await tool.height.fill("64");
    await tool.format.selectOption("jpeg");
    const file = await tool.download();

    expect(file.name).toBe("test-image-64x64.jpg");
    expect(file.data[0]).toBe(0xff);
    expect(file.data[1]).toBe(0xd8);
  });

  test("шум делает PNG заметно тяжелее однотонного", async () => {
    await tool.width.fill("200");
    await tool.height.fill("200");
    const plain = await tool.download();
    await tool.page.getByLabel(/Noise/).check();
    const noisy = await tool.download();

    expect(noisy.data.length).toBeGreaterThan(plain.data.length * 5);
  });

  test("ширина больше 8192 показывает ошибку и блокирует скачивание", async () => {
    await tool.width.fill("9000");

    await expect(tool.invalid).toBeVisible();
    await expect(tool.downloadButton).toBeDisabled();
  });

  test("площадь больше 40 мегапикселей тоже запрещена", async () => {
    await tool.width.fill("8000");
    await tool.height.fill("8000");

    await expect(tool.invalid).toBeVisible();
  });

  test("холст предпросмотра получает размеры выбранного образца", async () => {
    await tool.preset("16x16").click();

    await expect(tool.preview).toHaveJSProperty("width", 16);
    await expect(tool.preview).toHaveJSProperty("height", 16);
  });
});
