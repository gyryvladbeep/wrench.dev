import { test, expect } from "@playwright/test";
import { BinaryConverterPage } from "./pages/BinaryConverterPage";

const DEFAULT_INPUT = "Hello!";

// Точная копия textToBinary/binaryToText из components/tools/EncodingTools.tsx.
function textToBinary(str: string): string {
  return Array.from(new TextEncoder().encode(str))
    .map((b) => b.toString(2).padStart(8, "0"))
    .join(" ");
}
function binaryToText(bin: string): string {
  const bytes = bin.trim().replace(/\s+/g, " ").split(" ").map((b) => parseInt(b, 2));
  return new TextDecoder().decode(new Uint8Array(bytes));
}

test.describe("Binary Converter", () => {
  let tool: BinaryConverterPage;

  test.beforeEach(async ({ page }) => {
    tool = new BinaryConverterPage(page);
    await tool.goto();
  });

  test("по умолчанию режим Text → Binary и уже есть пример текста", async () => {
    await expect(tool.output).toHaveValue(textToBinary(DEFAULT_INPUT));
  });

  test("каждый байт дополняется нулями слева до 8 бит", async () => {
    // "!" = код 33 = 100001 в двоичной без паддинга, должен стать "00100001".
    await tool.setInput("!");
    await expect(tool.output).toHaveValue("00100001");
  });

  test("режим Binary → Text декодирует обратно в исходный текст", async () => {
    const original = "Round trip!";
    await tool.decodeButton.click();
    await tool.setInput(textToBinary(original));

    await expect(tool.output).toHaveValue(binaryToText(textToBinary(original)));
    await expect(tool.output).toHaveValue(original);
  });

  test("лишние пробелы между байтами при декодировании не мешают результату", async () => {
    const original = "spaced";
    const binWithExtraSpaces = textToBinary(original).split(" ").join("   ");

    await tool.decodeButton.click();
    await tool.setInput(binWithExtraSpaces);

    await expect(tool.output).toHaveValue(original);
  });

  test("полный цикл Encode → Decode возвращает исходный текст", async () => {
    const original = "QA automation";
    await tool.setInput(original);
    const encoded = await tool.output.inputValue();

    await tool.decodeButton.click();
    await tool.setInput(encoded);

    await expect(tool.output).toHaveValue(original);
  });
});
