import { test, expect } from "@playwright/test";
import { TestFileGeneratorPage } from "./pages/TestFileGeneratorPage";

test.describe("Test File Generator", () => {
  let tool: TestFileGeneratorPage;

  test.beforeEach(async ({ page }) => {
    tool = new TestFileGeneratorPage(page);
    await tool.goto();
  });

  test("по умолчанию 5 МБ равны 5242880 байтам", async () => {
    await expect(tool.bytes).toHaveText("5242880");
  });

  test("скачанный файл имеет ровно заданный размер: 1 КБ это 1024 байта", async () => {
    await tool.setSize("1", "KB");
    const file = await tool.download(tool.downloadButton);

    expect(file.name).toBe("test-file.bin");
    expect(file.data.length).toBe(1024);
  });

  test("размер в байтах скачивается точно: 12345 байт", async () => {
    await tool.setSize("12345", "B");
    const file = await tool.download(tool.downloadButton);

    expect(file.data.length).toBe(12345);
  });

  test("тип PNG меняет расширение имени и пишет сигнатуру PNG в начале файла", async () => {
    await tool.kind.selectOption("png");
    await tool.setSize("100", "B");

    await expect(tool.name).toHaveValue("test-file.png");
    const file = await tool.download(tool.downloadButton);
    expect([...file.data.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(file.data.length).toBe(100);
  });

  test("тип PDF начинается с %PDF-", async () => {
    await tool.kind.selectOption("pdf");
    await tool.setSize("64", "B");
    const file = await tool.download(tool.downloadButton);

    expect(file.data.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });

  test("нулевой размер даёт пустой файл", async () => {
    await tool.setSize("0", "B");
    const file = await tool.download(tool.downloadButton);

    expect(file.data.length).toBe(0);
  });

  test("размер выше 200 МБ ограничивается и показывает предупреждение", async () => {
    await tool.setSize("500", "MB");

    await expect(tool.bytes).toHaveText("209715200");
    await expect(tool.clamped).toBeVisible();
  });

  test("границы лимита 10 КБ: 10239, 10240 и 10241 байт", async () => {
    await tool.limit.fill("10");
    await tool.limitUnit.selectOption("KB");

    await expect(tool.boundary).toHaveCount(3);
    await expect(tool.boundary.nth(0)).toHaveAttribute("data-bytes", "10239");
    await expect(tool.boundary.nth(1)).toHaveAttribute("data-bytes", "10240");
    await expect(tool.boundary.nth(2)).toHaveAttribute("data-bytes", "10241");
  });

  test("файл «лимит плюс один» скачивается с размером в имени и точным размером", async () => {
    await tool.limit.fill("10");
    await tool.limitUnit.selectOption("KB");
    const file = await tool.download(tool.boundaryButton(2));

    expect(file.name).toBe("test-file-10241.bin");
    expect(file.data.length).toBe(10241);
  });

  test("кнопка «Use» у имени с кириллицей подставляет его в поле имени", async () => {
    await tool.namePreset("cyrillic").click();

    await expect(tool.name).toHaveValue("отчёт_финал.pdf");
  });

  test("имя из 244 символов подставляется целиком", async () => {
    await tool.namePreset("long").click();

    expect((await tool.name.inputValue()).length).toBe(244);
  });
});
