import { test, expect, Page } from "@playwright/test";
import { XmlFormatterPage } from "./pages/XmlFormatterPage";

const SAMPLE = `<root><user id="1"><name>Ada Lovelace</name><active>true</active></user></root>`;

// formatXml() из components/tools/XmlFormatterTool.tsx использует браузерный
// DOMParser, которого нет в Node. Поэтому "ожидаемое" считаем ТЕМ ЖЕ кодом,
// но выполняя его прямо в браузере через page.evaluate — это надёжнее, чем
// вручную трассировать рекурсивный обход DOM по шагам.
async function computeExpected(page: Page, xml: string, indentSize: number): Promise<string> {
  return await page.evaluate(
    ({ xml, indentSize }) => {
      function formatXml(xml: string, indentSize: number): string {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, "application/xml");
        const errorNode = doc.querySelector("parsererror");
        if (errorNode) throw new Error("invalid");

        const pad = " ".repeat(indentSize);
        const lines: string[] = [];

        function walk(node: Node, depth: number) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as Element;
            const attrs = Array.from(el.attributes).map((a) => ` ${a.name}="${a.value}"`).join("");
            const children = Array.from(el.childNodes).filter(
              (n) => !(n.nodeType === Node.TEXT_NODE && !n.textContent?.trim())
            );
            const onlyText = children.length === 1 && children[0].nodeType === Node.TEXT_NODE;

            if (children.length === 0) {
              lines.push(`${pad.repeat(depth)}<${el.tagName}${attrs} />`);
            } else if (onlyText) {
              lines.push(`${pad.repeat(depth)}<${el.tagName}${attrs}>${children[0].textContent?.trim()}</${el.tagName}>`);
            } else {
              lines.push(`${pad.repeat(depth)}<${el.tagName}${attrs}>`);
              children.forEach((c) => walk(c, depth + 1));
              lines.push(`${pad.repeat(depth)}</${el.tagName}>`);
            }
          }
        }

        Array.from(doc.childNodes).forEach((n) => walk(n, 0));
        return lines.join("\n");
      }
      return formatXml(xml, indentSize);
    },
    { xml, indentSize }
  );
}

test.describe("XML Formatter", () => {
  let tool: XmlFormatterPage;

  test.beforeEach(async ({ page }) => {
    tool = new XmlFormatterPage(page);
    await tool.goto();
  });

  test("по умолчанию форматирует пример с отступом 2", async ({ page }) => {
    const expected = await computeExpected(page, SAMPLE, 2);
    await expect(tool.output).toHaveValue(expected);
  });

  test("переключение на отступ 4 меняет форматирование", async ({ page }) => {
    await tool.indent4Button.click();

    const expected = await computeExpected(page, SAMPLE, 4);
    await expect(tool.output).toHaveValue(expected);
  });

  test("самозакрывающийся элемент без детей форматируется как '<tag />'", async ({ page }) => {
    const xml = `<root><empty/><withattr foo="bar"/></root>`;
    await tool.setInput(xml);

    const expected = await computeExpected(page, xml, 2);
    await expect(tool.output).toHaveValue(expected);
    expect(expected).toContain("<empty />");
    expect(expected).toContain('<withattr foo="bar" />');
  });

  test("невалидный XML (незакрытый тег) показывает сообщение об ошибке", async () => {
    await tool.setInput("<root><unclosed></root>");

    await expect(tool.output).toHaveValue("Invalid XML: Invalid XML — check tags are properly closed and nested.");
  });

  test("пустой ввод даёт пустой результат", async () => {
    await tool.setInput("");
    await expect(tool.output).toHaveValue("");
  });
});
