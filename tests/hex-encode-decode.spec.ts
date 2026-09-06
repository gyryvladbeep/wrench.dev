import { test, expect } from "@playwright/test";
import { HexEncodeDecodePage } from "./pages/HexEncodeDecodePage";

const DEFAULT_INPUT = "Hello, Dev Toolbox!";

// Точная копия textToHex/hexToText из components/tools/EncodingTools.tsx.
function textToHex(str: string): string {
  return Array.from(new TextEncoder().encode(str))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");
}
function hexToText(hex: string): string {
  const bytes = hex.trim().replace(/\s+/g, " ").split(" ").map((h) => parseInt(h, 16));
  return new TextDecoder().decode(new Uint8Array(bytes));
}

test.describe("Hex Encode / Decode", () => {
  let tool: HexEncodeDecodePage;

  test.beforeEach(async ({ page }) => {
    tool = new HexEncodeDecodePage(page);
    await tool.goto();
  });

  test("по умолчанию режим Text → Hex и уже есть пример текста", async () => {
    await expect(tool.output).toHaveValue(textToHex(DEFAULT_INPUT));
  });

  test("многобайтовые UTF-8 символы кодируются в несколько hex-байт каждый", async () => {
    const text = "Café — 日本語";
    await tool.setInput(text);

    await expect(tool.output).toHaveValue(textToHex(text));
  });

  test("режим Hex → Text декодирует обратно в исходный текст", async () => {
    const original = "Round trip works!";
    await tool.decodeButton.click();
    await tool.setInput(textToHex(original));

    await expect(tool.output).toHaveValue(hexToText(textToHex(original)));
    await expect(tool.output).toHaveValue(original);
  });

  test("лишние пробелы между hex-байтами при декодировании не мешают результату", async () => {
    const original = "spaced";
    const hexWithExtraSpaces = textToHex(original).split(" ").join("   ");

    await tool.decodeButton.click();
    await tool.setInput(hexWithExtraSpaces);

    await expect(tool.output).toHaveValue(original);
  });

  test("полный цикл Encode → Decode возвращает исходный текст", async () => {
    const original = "QA engineer since 2022";
    await tool.setInput(original);
    const encoded = await tool.output.inputValue();

    await tool.decodeButton.click();
    await tool.setInput(encoded);

    await expect(tool.output).toHaveValue(original);
  });
});
