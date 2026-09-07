import { test, expect } from "@playwright/test";
import { MarkdownToHtmlPage } from "./pages/MarkdownToHtmlPage";

// Точная копия mdToHtml() из components/tools/MarkdownToHtmlTool.tsx
// (после фикса бага с лишними <p> внутри многострочных код-блоков —
// см. коммент в самом источнике).
function mdToHtml(md: string): string {
  const codeBlocks: string[] = [];
  return md
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (_m, lang: string | undefined, code: string) => {
      const html = `<pre><code class="language-${lang ?? ""}">${code}</code></pre>`;
      codeBlocks.push(html);
      return `<codeblock${codeBlocks.length - 1}/>`;
    })
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
    .replace(/<codeblock(\d+)\/>/g, (_m, i: string) => codeBlocks[Number(i)])
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

  test("РЕГРЕСС на исправленный баг: однострочный код-блок больше не оборачивает закрывающий </code></pre> в <p>", async () => {
    // Раньше параграф-regex не распознавал "</code></pre>" как "уже тег"
    // (он начинается с "</", а не "<" + строчная буква) и оборачивал его в
    // <p>...</p> прямо внутри <pre><code>. После фикса код-блок на время
    // шага "Paragraphs" прячется за плейсхолдером и восстанавливается
    // целиком, без вставленных <p>.
    const input = "```python\nprint('hi')\n```";
    await tool.setInput(input);
    const expected = mdToHtml(input);

    await expect(tool.output).toHaveValue(expected);
    await expect(tool.output).toHaveValue('<pre><code class="language-python">print(\'hi\')\n</code></pre>');
    await expect(tool.output).not.toHaveValue(/<p>/);
  });

  test("РЕГРЕСС: многострочный код-блок — ни одна внутренняя строка не оборачивается в <p>", async () => {
    // До фикса каждая НЕ-первая строка внутри код-блока (не только
    // закрывающий </code></pre>) тоже ошибочно оборачивалась в <p>,
    // поскольку параграф-regex обрабатывал уже вставленный <pre><code>...
    // текст построчно, а "уже тегом" считал только самую первую строку.
    const input = "```js\nconst a = 1;\nconst b = 2;\nconsole.log(a + b);\n```";
    await tool.setInput(input);
    const expected = mdToHtml(input);

    await expect(tool.output).toHaveValue(expected);
    await expect(tool.output).toHaveValue(
      '<pre><code class="language-js">const a = 1;\nconst b = 2;\nconsole.log(a + b);\n</code></pre>'
    );
  });

  test("код-блок, окружённый обычными абзацами — абзацы вокруг него оборачиваются в <p>, сам блок — нет", async () => {
    const input = "before text\n\n```js\ncode();\n```\n\nafter text";
    await tool.setInput(input);
    const expected = mdToHtml(input);

    await expect(tool.output).toHaveValue(expected);
    await expect(tool.output).toHaveValue(/<p>before text<\/p>/);
    await expect(tool.output).toHaveValue(/<p>after text<\/p>/);
    // toHaveValue со строкой требует ТОЧНОГО совпадения всего textarea —
    // здесь в textarea ещё есть "before text"/"after text" вокруг блока,
    // поэтому для проверки самого блока внутри нужен regex (частичное
    // совпадение), а не строка.
    await expect(tool.output).toHaveValue(/<pre><code class="language-js">code\(\);\n<\/code><\/pre>/);
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
