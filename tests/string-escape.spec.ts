import { test, expect } from "@playwright/test";
import { StringEscapePage } from "./pages/StringEscapePage";

type Mode = "json" | "html" | "url" | "regex" | "sql" | "csv";

// Точная копия escape() и SAMPLE из components/tools/StringEscapeTool.tsx.
function escape(text: string, mode: Mode, encode: boolean): string {
  if (encode) {
    switch (mode) {
      case "json":  return text.replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/\n/g,"\\n").replace(/\r/g,"\\r").replace(/\t/g,"\\t");
      case "html":  return text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
      case "url":   return encodeURIComponent(text);
      case "regex": return text.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
      case "sql":   return text.replace(/'/g,"''").replace(/\\/g,"\\\\");
      case "csv":   return text.includes(",") || text.includes('"') || text.includes("\n") ? `"${text.replace(/"/g,'""')}"` : text;
    }
  } else {
    switch (mode) {
      case "json":  return text.replace(/\\n/g,"\n").replace(/\\r/g,"\r").replace(/\\t/g,"\t").replace(/\\"/g,'"').replace(/\\\\/g,"\\");
      case "html":  return text.replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;/g,"'");
      case "url":   return decodeURIComponent(text);
      case "regex": return text.replace(/\\([.*+?^${}()|[\]\\])/g,"$1");
      case "sql":   return text.replace(/''/g,"'").replace(/\\\\/g,"\\");
      case "csv":   return text.replace(/^"|"$/g,"").replace(/""/g,'"');
    }
  }
  throw new Error("unreachable");
}

const SAMPLE: Record<Mode, string> = {
  json:  `Hello "World"\nNew line\tTabbed`,
  html:  `<script>alert('XSS')</script> & more`,
  url:   `search query with spaces & symbols=true`,
  regex: `https://example.com/path?q=test`,
  sql:   `O'Brien's "special" value`,
  csv:   `value with "quotes" and, commas`,
};

test.describe("String Escape / Unescape", () => {
  let tool: StringEscapePage;

  test.beforeEach(async ({ page }) => {
    tool = new StringEscapePage(page);
    await tool.goto();
  });

  test("по умолчанию режим JSON + Escape — экранирует пример текста", async () => {
    await expect(tool.input).toHaveValue(SAMPLE.json);
    await expect(tool.output).toHaveValue(escape(SAMPLE.json, "json", true));
  });

  test("переключение на HTML подставляет свой пример и экранирует спецсимволы", async () => {
    await tool.htmlModeButton.click();

    await expect(tool.input).toHaveValue(SAMPLE.html);
    await expect(tool.output).toHaveValue(escape(SAMPLE.html, "html", true));
    await expect(tool.output).toHaveValue(/&lt;script&gt;/);
  });

  test("режим URL кодирует пример через encodeURIComponent", async () => {
    await tool.urlModeButton.click();

    await expect(tool.output).toHaveValue(encodeURIComponent(SAMPLE.url));
  });

  test("режим Regex экранирует спецсимволы регулярных выражений", async () => {
    await tool.regexModeButton.click();

    await expect(tool.output).toHaveValue(escape(SAMPLE.regex, "regex", true));
    await expect(tool.output).toHaveValue(/example\\\.com/);
  });

  test("режим SQL удваивает одинарные кавычки", async () => {
    await tool.sqlModeButton.click();

    await expect(tool.output).toHaveValue(escape(SAMPLE.sql, "sql", true));
    await expect(tool.output).toHaveValue(/O''Brien''s/);
  });

  test("режим CSV оборачивает значение с запятой/кавычками в кавычки и удваивает внутренние", async () => {
    await tool.csvModeButton.click();

    await expect(tool.output).toHaveValue(escape(SAMPLE.csv, "csv", true));
    await expect(tool.output).toHaveValue(/^".*"$/);
  });

  test("CSV без запятых и кавычек остаётся без обрамляющих кавычек", async () => {
    await tool.csvModeButton.click();
    await tool.setInput("simple value");

    await expect(tool.output).toHaveValue("simple value");
  });

  test("Escape → Unescape по экранированному JSON-результату возвращает исходный текст", async () => {
    const escaped = escape(SAMPLE.json, "json", true);

    await tool.unescapeButton.click();
    await tool.setInput(escaped);

    await expect(tool.output).toHaveValue(SAMPLE.json);
  });
});
