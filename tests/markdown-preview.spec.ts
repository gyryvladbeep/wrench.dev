import { test, expect } from "@playwright/test";
import { marked } from "marked";
import { MarkdownPreviewPage } from "./pages/MarkdownPreviewPage";

// Та же конфигурация marked, что и в components/tools/MarkdownPreviewTool.tsx —
// используем реальную библиотеку (тот же marked из node_modules), а не
// собственную реализацию, поэтому "ожидаемое" — это просто вызов marked()
// с теми же опциями.
marked.setOptions({ gfm: true, breaks: true });

const SAMPLE = `# Hello, Markdown!

Write **bold**, *italic*, or \`inline code\`.

## Features

- [x] Renders instantly
- [x] GitHub Flavored Markdown
- [x] No data uploaded

\`\`\`json
{"tool": "Dev Toolbox", "awesome": true}
\`\`\`

> Tip: Try pasting any README.md here.

| Column A | Column B |
|----------|----------|
| Cell 1   | Cell 2   |
`;

test.describe("Markdown Preview", () => {
  let tool: MarkdownPreviewPage;

  test.beforeEach(async ({ page }) => {
    tool = new MarkdownPreviewPage(page);
    await tool.goto();
  });

  test("по умолчанию режим Split — слева markdown SAMPLE, справа отрендеренный preview", async () => {
    await expect(tool.input).toHaveValue(SAMPLE);
    await expect(tool.previewPane).toBeVisible();
    await expect(tool.previewPane.locator("h1")).toHaveText("Hello, Markdown!");
    await expect(tool.previewPane.locator("strong", { hasText: "bold" })).toBeVisible();
    await expect(tool.previewPane.locator("code", { hasText: "inline code" })).toBeVisible();
  });

  test("чекбоксы GFM, кодовый блок и таблица рендерятся в preview", async () => {
    await expect(tool.previewPane.locator('input[type="checkbox"]')).toHaveCount(3);
    await expect(tool.previewPane.locator("pre code")).toContainText('"tool": "Dev Toolbox"');
    await expect(tool.previewPane.locator("table td", { hasText: "Cell 1" })).toBeVisible();
    await expect(tool.previewPane.locator("table td", { hasText: "Cell 2" })).toBeVisible();
    await expect(tool.previewPane.locator("blockquote")).toContainText("Try pasting any README.md here");
  });

  test("режим Markdown (source) скрывает preview, режим Preview скрывает textarea", async () => {
    await tool.switchView("source");
    await expect(tool.previewPane).toBeHidden();
    await expect(tool.input).toBeVisible();

    await tool.switchView("preview");
    await expect(tool.previewPane).toBeVisible();
    await expect(tool.input).toBeHidden();

    await tool.switchView("split");
    await expect(tool.previewPane).toBeVisible();
    await expect(tool.input).toBeVisible();
  });

  test("собственный текст рендерится через marked() с теми же опциями (gfm+breaks)", async () => {
    const custom = "Line one\nLine two, soft break above\n\n## A heading";
    await tool.setInput(custom);

    const expectedHtml = marked(custom) as string;
    // breaks: true конвертирует одиночный перенос строки внутри абзаца в
    // <br> — проверяем, что реальная библиотека это сделала (а не наша
    // догадка), и что счёт <br> в DOM совпадает именно с этим выводом.
    expect(expectedHtml).toContain("<br>");
    const expectedBrCount = (expectedHtml.match(/<br>/g) ?? []).length;
    await expect(tool.previewPane.locator("h2")).toHaveText("A heading");
    await expect(tool.previewPane.locator("br")).toHaveCount(expectedBrCount);
  });

  test("кнопка Copy HTML копирует именно marked(input), а не текст markdown", async ({ context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    const custom = "**strong text**";
    await tool.setInput(custom);
    await tool.copyHtmlButton.click();

    const clipboardText = await tool.page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(marked(custom) as string);
    expect(clipboardText).toContain("<strong>strong text</strong>");
  });

  test("пустой ввод — preview пустой, без ошибок", async () => {
    await tool.setInput("");
    await expect(tool.previewPane).toHaveText("");
  });
});
