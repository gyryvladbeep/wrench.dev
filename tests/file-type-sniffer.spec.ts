import { test, expect } from "@playwright/test";
import { FileTypeSnifferPage } from "./pages/FileTypeSnifferPage";

test.describe("file-type-sniffer", () => {
  let tool: FileTypeSnifferPage;

  test.beforeEach(async ({ page }) => {
    tool = new FileTypeSnifferPage(page);
    await tool.goto();
  });

  const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13];

  test("до выбора файла показана подсказка", async () => {
    await expect(tool.empty).toBeVisible();
  });

  test("PNG под именем photo.jpg: расширение и MIME не совпадают с содержимым", async () => {
    await tool.choose("photo.jpg", "image/jpeg", PNG);

    await expect(tool.type).toHaveAttribute("data-type", "PNG");
    await expect(tool.finding("extension-mismatch")).toBeVisible();
    await expect(tool.finding("mime-mismatch")).toBeVisible();
  });

  test("честный PNG даёт ok", async () => {
    await tool.choose("pic.png", "image/png", PNG);

    await expect(tool.finding("ok")).toBeVisible();
    await expect(tool.page.getByTestId("fz-size")).toHaveText("12 B");
  });

  test("report.pdf.exe с заголовком MZ: двойное расширение и исполняемый файл", async () => {
    await tool.choose("report.pdf.exe", "application/pdf", [0x4d, 0x5a, 0, 0]);

    await expect(tool.finding("double-extension")).toBeVisible();
    await expect(tool.finding("executable")).toBeVisible();
  });

  test("hex-дамп показывает первые байты PNG", async () => {
    await tool.choose("pic.png", "image/png", PNG);

    await expect(tool.hex).toContainText("89 50 4e 47");
  });
});
