import { test, expect } from "@playwright/test";
import { PasteDropInspectorPage } from "./pages/PasteDropInspectorPage";

test.describe("Paste and Drop Inspector", () => {
  let tool: PasteDropInspectorPage;

  test.beforeEach(async ({ page }) => {
    tool = new PasteDropInspectorPage(page);
    await tool.goto();
  });

  test("в начале показано, что ничего не вставлено", async () => {
    await expect(tool.empty).toBeVisible();
    await expect(tool.result).toHaveCount(0);
  });

  test("вставка текста и HTML показывает оба представления и типы", async () => {
    await tool.paste({ text: "hello world", html: "<b>hello</b> world" });

    await expect(tool.result).toHaveAttribute("data-source", "paste");
    await expect(tool.text).toHaveText("hello world");
    await expect(tool.html).toContainText("<b>hello</b>");
    await expect(tool.types).toContainText("text/plain");
    await expect(tool.types).toContainText("text/html");
  });

  test("вставка файла показывает имя, тип и размер в байтах", async () => {
    await tool.paste({ file: { name: "note.txt", type: "text/plain", content: "abc" } });

    await expect(tool.files).toHaveCount(1);
    await expect(tool.files.first()).toHaveAttribute("data-name", "note.txt");
    await expect(tool.files.first()).toContainText("3 B");
    await expect(tool.items.first()).toContainText("file");
  });

  test("перетаскивание файла помечается как drop", async () => {
    await tool.drop({ name: "pic.png", type: "image/png", content: "xyz" });

    await expect(tool.result).toHaveAttribute("data-source", "drop");
    await expect(tool.files.first()).toContainText("image/png");
  });

  test("кнопка «Clear» возвращает пустое состояние", async () => {
    await tool.paste({ text: "x" });
    await tool.page.getByRole("button", { name: "Clear", exact: true }).click();

    await expect(tool.empty).toBeVisible();
  });
});
