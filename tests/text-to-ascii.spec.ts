import { test, expect } from "@playwright/test";
import { AsciiArtPage } from "./pages/AsciiArtPage";

// Точная копия карты глифов TINY и функции toAsciiArt() из
// components/tools/AsciiArtTool.tsx — воспроизводим 1-в-1, чтобы "ожидаемое"
// значение считалось так же, как считает сама страница.
const TINY: Record<string, string[]> = {
  A:["  #  "," # # ","#####","#   #","#   #"],B:["#### ","#   #","#### ","#   #","#### "],
  C:[" ####","#    ","#    ","#    "," ####"],D:["#### ","#   #","#   #","#   #","#### "],
  E:["#####","#    ","#### ","#    ","#####"],F:["#####","#    ","#### ","#    ","#    "],
  G:[" ####","#    ","# ###","#   #"," ### "],H:["#   #","#   #","#####","#   #","#   #"],
  I:[" ### ","  #  ","  #  ","  #  "," ### "],J:["  ###","   # ","   # ","#  # "," ##  "],
  K:["#   #","#  # ","###  ","#  # ","#   #"],L:["#    ","#    ","#    ","#    ","#####"],
  M:["#   #","## ##","# # #","#   #","#   #"],N:["#   #","##  #","# # #","#  ##","#   #"],
  O:[" ### ","#   #","#   #","#   #"," ### "],P:["#### ","#   #","#### ","#    ","#    "],
  Q:[" ### ","#   #","# # #","#  # "," ## #"],R:["#### ","#   #","#### ","#  # ","#   #"],
  S:[" ####","#    "," ### ","    #","#### "],T:["#####","  #  ","  #  ","  #  ","  #  "],
  U:["#   #","#   #","#   #","#   #"," ### "],V:["#   #","#   #","#   #"," # # ","  #  "],
  W:["#   #","#   #","# # #","## ##","#   #"],X:["#   #"," # # ","  #  "," # # ","#   #"],
  Y:["#   #"," # # ","  #  ","  #  ","  #  "],Z:["#####","   # ","  #  "," #   ","#####"],
  " ":["     ","     ","     ","     ","     "],"0":[" ### ","#  ##","# # #","##  #"," ### "],
  "1":["  #  "," ##  ","  #  ","  #  ","#####"],"2":[" ### ","#   #","  ## "," #   ","#####"],
  "3":["#### ","    #","  ## ","    #","#### "],"4":["#   #","#   #","#####","    #","    #"],
  "5":["#####","#    ","#### ","    #","#### "],"6":[" ### ","#    ","#### ","#   #"," ### "],
  "7":["#####","    #","   # ","  #  ","  #  "],"8":[" ### ","#   #"," ### ","#   #"," ### "],
  "9":[" ### ","#   #"," ### ","    #"," ### "],"!":[" # "," # "," # ","   "," # "],
  "?":[" ## ","   #","  # ","    "," #  "],".":[" ","  ","  ","  ","# "],
};

function toAsciiArt(text: string): string {
  const chars = text.toUpperCase().split("");
  const lines = [0,1,2,3,4].map(() => "");
  chars.forEach((c) => {
    const glyph = TINY[c] ?? TINY[" "];
    glyph.forEach((row, i) => { lines[i] += row + " "; });
  });
  return lines.join("\n");
}

test.describe("Text → ASCII Art", () => {
  let tool: AsciiArtPage;

  test.beforeEach(async ({ page }) => {
    tool = new AsciiArtPage(page);
    await tool.goto();
  });

  test("по умолчанию показывает ASCII-арт для примера WRENCH", async () => {
    const expected = toAsciiArt("WRENCH");
    await expect(tool.output).toHaveText(expected);
    await expect(tool.counter).toContainText("6/20");
  });

  test("строчные буквы приводятся к верхнему регистру перед рендером", async () => {
    await tool.setInput("wrench");
    const expected = toAsciiArt("WRENCH");

    expect(await tool.outputText()).toBe(expected);
  });

  test("ввод длиннее 20 символов обрезается до 20", async () => {
    await tool.setInput("ABCDEFGHIJKLMNOPQRSTUVWXYZ"); // 26 символов

    await expect(tool.input).toHaveValue("ABCDEFGHIJKLMNOPQRSTUVWXYZ".slice(0, 20));
    await expect(tool.counter).toContainText("20/20");
    expect(await tool.outputText()).toBe(toAsciiArt("ABCDEFGHIJKLMNOPQRSTUVWXYZ".slice(0, 20)));
  });

  test("неизвестный символ рендерится как пустой (пробельный) глиф без падения приложения", async () => {
    // "@" отсутствует в карте TINY — должен подставиться пустой глиф TINY[" "].
    await tool.setInput("A@");
    const expected = toAsciiArt("A@");

    expect(await tool.outputText()).toBe(expected);
    // Явно убеждаемся, что "@"-глиф действительно пустой (все строки — пробелы).
    const lines = expected.split("\n");
    for (const line of lines) {
      expect(line.endsWith("      ")).toBe(true); // 5 пробелов глифа + разделитель
    }
  });

  test("каждая строка результата состоит из 5 строк, длина = 6 × длину текста", async () => {
    await tool.setInput("QA");
    const text = await tool.outputText();
    const lines = text.split("\n");

    expect(lines).toHaveLength(5);
    for (const line of lines) {
      expect(line.length).toBe(6 * "QA".length);
    }
  });
});
