import { test, expect } from "@playwright/test";
import { MarkdownToHtmlPage } from "./pages/MarkdownToHtmlPage";

// Точная копия mdToHtml() из components/tools/MarkdownToHtmlTool.tsx.
function mdToHtml(md: string): string {
  return md
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^---$/gm, '<hr>')
    .replace(/^\|(.+)\|$/gm, (_, row) => {
      const cells = row.split("|").map((c: string) => c.trim());
      return '<tr>' + cells.map((c: string) => c.match(/^-+$/) ? '' : `<td>${c}</td>`).join('') + '</tr>';
    })
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(?!<[a-z]).+$/gm, (line) => line.trim() ? `<p>${line}</p>` : '')
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const SAMPLE = `# Hello, Wrench!

A **professional** toolbox for _developers_ and QA engineers.

## Features

- 60+ browser-based tools
- Daily challenges
- Interview prep
- EN/RU support

## Code Example

\`\`\`javascript
const tools = wrench.getTools({ category: 'qa' });
tools.forEach(tool => tool.run());
\`\`\`

> "The best tools are the ones you actually use."

[Visit Wrench](https://wrench-dev-lr29.vercel.app) | **Free to use**

---

| Tool | Category | Status |
|------|----------|--------|
| Regex Tester | QA | ✅ Ready |
| JSON Diff | Formatting | ✅ Ready |
`;

test.describe("Markdown to HTML", () => {
  let tool: MarkdownToHtmlPage;

  test.beforeEach(async ({ page }) => {
    tool = new MarkdownToHtmlPage(page);
    await tool.goto();
  });

  test("дефолтный SAMPLE конвертируется в HTML по формуле mdToHtml()", async () => {
    const expected = mdToHtml(SAMPLE);
    await expect(tool.output).toHaveValue(expected);
    await expect(tool.output).toHaveValue(/<h1>Hello, Wrench!<\/h1>/);
    await expect(tool.output).toHaveValue(/<strong>professional<\/strong>/);
    await expect(tool.output).toHaveValue(/<li>60\+ browser-based tools<\/li>/);
  });

  test("переключение в режим Preview рендерит реальный HTML (виден жирный текст)", async () => {
    await tool.togglePreview(true);

    await expect(tool.previewPane).toBeVisible();
    await expect(tool.previewPane.locator("strong", { hasText: "professional" })).toBeVisible();
    await expect(tool.previewPane.locator("h1", { hasText: "Hello, Wrench!" })).toBeVisible();
  });

  test("ИЗВЕСТНОЕ ОГРАНИЧЕНИЕ: многострочный код-блок получает лишний <p> вокруг закрывающего </code></pre>", async () => {
    // Параграф-regex `.replace(/^(?!<[a-z]).+$/gm, ...)` идёт ПОСЛЕ обработки
    // code-блоков и проверяет только начало строки: "</code></pre>" начинается
    // с "</", а не "<" + строчная буква, поэтому негативный lookahead
    // `(?!<[a-z])` пропускает эту строку — и она ошибочно оборачивается в
    // <p>...</p>. Тест фиксирует РЕАЛЬНОЕ поведение страницы (совпадает с
    // mdToHtml() 1-в-1); это находка для отдельного обсуждения, не баг теста.
    const input = "```python\nprint('hi')\n```";
    await tool.setInput(input);
    const expected = mdToHtml(input);

    await expect(tool.output).toHaveValue(expected);
    await expect(tool.output).toHaveValue('<pre><code class="language-python">print(\'hi\')\n<p></code></pre></p>');
  });

  test("таблица markdown конвертируется в строки <tr><td>", async () => {
    const input = "| A | B |\n|---|---|\n| 1 | 2 |";
    await tool.setInput(input);
    const expected = mdToHtml(input);

    await expect(tool.output).toHaveValue(expected);
    await expect(tool.output).toHaveValue(/<tr><td>A<\/td><td>B<\/td><\/tr>/);
  });

  test("пустой ввод — плейсхолдер вместо textarea", async () => {
    await tool.setInput("");
    await expect(tool.output).toBeHidden();
  });
});
