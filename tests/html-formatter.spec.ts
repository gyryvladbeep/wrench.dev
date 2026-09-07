import { test, expect, Page } from "@playwright/test";
import { HtmlFormatterPage } from "./pages/HtmlFormatterPage";

const SAMPLE = `<div class="card"><h2>Title</h2><p>Some text with <a href="#">a link</a>.</p></div>`;

/**
 * formatHtml() в components/tools/HtmlFormatterTool.tsx использует
 * DOMParser — браузерный API, недоступный в Node. Поэтому вместо ручного
 * трейсинга рекурсивного обхода DOM выполняем ТОЧНО ТУ ЖЕ функцию внутри
 * настоящего браузера через page.evaluate() — так же, как для XmlFormatterTool
 * в батче 4.
 */
async function computeExpected(page: Page, html: string, indentSize: number): Promise<string> {
  return page.evaluate(
    ({ html, indentSize }) => {
      const VOID_ELEMENTS = new Set([
        "area","base","br","col","embed","hr","img","input",
        "link","meta","param","source","track","wbr",
      ]);
      function formatHtml(html: string, indentSize: number): string {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const pad = " ".repeat(indentSize);
        const lines: string[] = [];
        function walk(node: Node, depth: number) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as Element;
            const tag = el.tagName.toLowerCase();
            const attrs = Array.from(el.attributes).map((a) => ` ${a.name}="${a.value}"`).join("");
            if (VOID_ELEMENTS.has(tag)) { lines.push(`${pad.repeat(depth)}<${tag}${attrs}>`); return; }
            const children = Array.from(el.childNodes).filter(
              (n) => !(n.nodeType === Node.TEXT_NODE && !n.textContent?.trim())
            );
            const onlyText = children.length === 1 && children[0].nodeType === Node.TEXT_NODE;
            if (children.length === 0) {
              lines.push(`${pad.repeat(depth)}<${tag}${attrs}></${tag}>`);
            } else if (onlyText) {
              lines.push(`${pad.repeat(depth)}<${tag}${attrs}>${children[0].textContent?.trim()}</${tag}>`);
            } else {
              lines.push(`${pad.repeat(depth)}<${tag}${attrs}>`);
              children.forEach((c) => walk(c, depth + 1));
              lines.push(`${pad.repeat(depth)}</${tag}>`);
            }
          } else if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent?.trim();
            if (text) lines.push(`${pad.repeat(depth)}${text}`);
          }
        }
        Array.from(doc.body.childNodes).forEach((n) => walk(n, 0));
        return lines.join("\n");
      }
      return formatHtml(html, indentSize);
    },
    { html, indentSize }
  );
}

test.describe("HTML Formatter", () => {
  let tool: HtmlFormatterPage;

  test.beforeEach(async ({ page }) => {
    tool = new HtmlFormatterPage(page);
    await tool.goto();
  });

  test("дефолтный SAMPLE форматируется с отступом 2 (значение по умолчанию)", async () => {
    const expected = await computeExpected(tool.page, SAMPLE, 2);
    await expect(tool.output).toHaveValue(expected);
  });

  test("переключение на отступ 4 меняет форматирование", async () => {
    await tool.setIndent(4);
    const expected = await computeExpected(tool.page, SAMPLE, 4);
    await expect(tool.output).toHaveValue(expected);
  });

  test("пустой тег без детей форматируется как открывающий+закрывающий тег на одной строке", async () => {
    const input = `<div><span></span></div>`;
    await tool.setInput(input);
    const expected = await computeExpected(tool.page, input, 2);
    await expect(tool.output).toHaveValue(expected);
    await expect(tool.output).toHaveValue(/<span><\/span>/);
  });

  test("void-элемент (br) выводится без закрывающего тега", async () => {
    const input = `<p>Line1<br>Line2</p>`;
    await tool.setInput(input);
    const expected = await computeExpected(tool.page, input, 2);
    await expect(tool.output).toHaveValue(expected);
  });

  test("пустой ввод — пустой вывод", async () => {
    await tool.setInput("");
    await expect(tool.output).toHaveValue("");
  });
});
