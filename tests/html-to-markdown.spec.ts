import { test, expect } from "@playwright/test";
import { HtmlToMarkdownPage } from "./pages/HtmlToMarkdownPage";

// Точная копия htmlToMd() из components/tools/HtmlToMarkdownTool.tsx.
function htmlToMd(html: string): string {
  return html
    .replace(/<h([1-6])[^>]*>(.*?)<\/h\1>/gis, (_, l, c) => `${"#".repeat(Number(l))} ${c.replace(/<[^>]+>/g,"").trim()}\n\n`)
    .replace(/<strong[^>]*>(.*?)<\/strong>/gis, (_, c) => `**${c.replace(/<[^>]+>/g,"")}**`)
    .replace(/<b[^>]*>(.*?)<\/b>/gis, (_, c) => `**${c.replace(/<[^>]+>/g,"")}**`)
    .replace(/<em[^>]*>(.*?)<\/em>/gis, (_, c) => `*${c.replace(/<[^>]+>/g,"")}*`)
    .replace(/<i[^>]*>(.*?)<\/i>/gis, (_, c) => `*${c.replace(/<[^>]+>/g,"")}*`)
    .replace(/<code[^>]*>(.*?)<\/code>/gis, (_, c) => `\`${c.replace(/<[^>]+>/g,"")}\``)
    .replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, (_, c) => `\`\`\`\n${c.replace(/<[^>]+>/g,"")}\n\`\`\`\n`)
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gis, (_, href, text) => `[${text.replace(/<[^>]+>/g,"")}](${href})`)
    .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*/gis, (_m: string, src: string, alt: string) => `![${alt}](${src})`)
    .replace(/<img[^>]*src="([^"]*)"[^>]*/gis, (_m: string, src: string) => `![image](${src})`)
    .replace(/<ul[^>]*>(.*?)<\/ul>/gis, (_m: string, c: string) => c.replace(/<li[^>]*>(.*?)<\/li>/gis, (_l: string, i: string) => `- ${i.replace(/<[^>]+>/g,"").trim()}\n`) + "\n")
    .replace(/<ol[^>]*>(.*?)<\/ol>/gis, (_m: string, c: string) => { let n=0; return c.replace(/<li[^>]*>(.*?)<\/li>/gis, (_l: string, i: string) => `${++n}. ${i.replace(/<[^>]+>/g,"").trim()}\n`) + "\n"; })
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, (_m: string, c: string) => c.split("\n").map((l: string)=>`> ${l}`).join("\n") + "\n")
    .replace(/<hr[^>]*/gi, "---\n")
    .replace(/<br[^>]*/gi, "\n")
    .replace(/<p[^>]*>(.*?)<\/p>/gis, (_, c) => `${c.replace(/<[^>]+>/g,"").trim()}\n\n`)
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#039;/g,"'").replace(/&nbsp;/g," ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const SAMPLE = `<h1>Hello, World!</h1>
<p>This is a <strong>bold</strong> and <em>italic</em> paragraph.</p>
<h2>Features</h2>
<ul>
  <li>Converts <code>HTML</code> to Markdown</li>
  <li>Handles <a href="https://example.com">links</a></li>
  <li>Supports lists, headings, blockquotes</li>
</ul>
<blockquote><p>This is a blockquote</p></blockquote>`;

test.describe("HTML to Markdown", () => {
  let tool: HtmlToMarkdownPage;

  test.beforeEach(async ({ page }) => {
    tool = new HtmlToMarkdownPage(page);
    await tool.goto();
  });

  test("дефолтный SAMPLE конвертируется в markdown по формуле htmlToMd()", async () => {
    const expected = htmlToMd(SAMPLE);
    await expect(tool.output).toHaveValue(expected);
    await expect(tool.output).toHaveValue(/^# Hello, World!/);
    await expect(tool.output).toHaveValue(/\*\*bold\*\*/);
    await expect(tool.output).toHaveValue(/\[links\]\(https:\/\/example\.com\)/);
  });

  test("вложенные inline-теги (strong внутри p) конвертируются корректно", async () => {
    const input = `<p>Text with <strong>bold <em>and italic</em></strong> inside.</p>`;
    await tool.setInput(input);
    const expected = htmlToMd(input);
    await expect(tool.output).toHaveValue(expected);
  });

  test("нумерованный список (ol) конвертируется с возрастающими номерами", async () => {
    const input = `<ol><li>First</li><li>Second</li><li>Third</li></ol>`;
    await tool.setInput(input);
    const expected = htmlToMd(input);
    await expect(tool.output).toHaveValue(expected);
    await expect(tool.output).toHaveValue(/1\. First/);
    await expect(tool.output).toHaveValue(/3\. Third/);
  });

  test("HTML-entities декодируются (&amp; &lt; &gt; &quot;)", async () => {
    const input = `<p>Tom &amp; Jerry &lt;tag&gt; &quot;quoted&quot;</p>`;
    await tool.setInput(input);
    const expected = htmlToMd(input);
    await expect(tool.output).toHaveValue(expected);
    await expect(tool.output).toHaveValue('Tom & Jerry <tag> "quoted"');
  });

  test("пустой ввод — плейсхолдер вместо textarea", async () => {
    await tool.setInput("");
    await expect(tool.output).toBeHidden();
  });
});
