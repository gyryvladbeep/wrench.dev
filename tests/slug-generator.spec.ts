import { test, expect } from "@playwright/test";
import { SlugGeneratorPage } from "./pages/SlugGeneratorPage";

test.describe("Slug Generator", () => {
  let tool: SlugGeneratorPage;

  test.beforeEach(async ({ page }) => {
    tool = new SlugGeneratorPage(page);
    await tool.goto();
  });

  test("по умолчанию hyphen-case и уже есть пример текста", async () => {
    await expect(tool.output).toHaveText("hello-world-this-is-my-blog-post-title");
  });

  test("знаки препинания вырезаются, а не превращаются в отдельные разделители", async () => {
    // "!", "?", "—" не входят в [a-z0-9\s-] и просто выбрасываются, а не
    // заменяются на дефис — соседние пробелы вокруг них потом схлопываются
    // replace(/\s+/g, sep) в один разделитель.
    await tool.setInput("Wow!! Is this — really — a slug???");
    await expect(tool.output).toHaveText("wow-is-this-really-a-slug");
  });

  test("диакритика (é, à, ü…) приводится к обычным латинским буквам", async () => {
    await tool.setInput("Café déjà vu — naïve façade");
    await expect(tool.output).toHaveText("cafe-deja-vu-naive-facade");
  });

  test("underscore_case переключает разделитель на подчёркивание", async () => {
    await tool.underscoreButton.click();
    await expect(tool.output).toHaveText("hello_world_this_is_my_blog_post_title");
  });

  test("возврат на hyphen-case снова меняет разделитель", async () => {
    await tool.underscoreButton.click();
    await tool.hyphenButton.click();
    await expect(tool.output).toHaveText("hello-world-this-is-my-blog-post-title");
  });

  test("подряд идущие пробелы схлопываются в один разделитель", async () => {
    await tool.setInput("too    many     spaces");
    await expect(tool.output).toHaveText("too-many-spaces");
  });
});
