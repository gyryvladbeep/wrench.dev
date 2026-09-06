import { test, expect } from "@playwright/test";
import { WordCounterPage } from "./pages/WordCounterPage";

/**
 * word-counter — статистика по тексту (слова, символы, предложения,
 * абзацы, строки, время чтения). Формулы — обычный useMemo без сети и
 * без localStorage, поэтому эталон считаем ТЕМИ ЖЕ формулами прямо в
 * тесте (computeStats), а не подбираем цифры руками — так же, как
 * base64-encode-decode.spec.ts считает эталон через Buffer, а не пишет
 * строку в base64 вручную.
 */
function computeStats(text: string) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const charsNoSpaces = text.replace(/\s/g, "").length;
  const sentences = text.trim() ? (text.match(/[.!?]+/g) ?? []).length : 0;
  const paragraphs = text.trim() ? text.split(/\n\s*\n/).filter(Boolean).length : 0;
  const lines = text.split("\n").length;
  const readingTime = Math.max(1, Math.ceil(words / 200));
  return { words, chars, charsNoSpaces, sentences, paragraphs, lines, readingTime };
}

const DEFAULT_TEXT = "The quick brown fox jumps over the lazy dog.\nThis is a second sentence. And a third!";

test.describe("Word Counter", () => {
  let tool: WordCounterPage;

  test.beforeEach(async ({ page }) => {
    tool = new WordCounterPage(page);
    await tool.goto();
  });

  test("по умолчанию считает статистику для примера текста", async () => {
    const s = computeStats(DEFAULT_TEXT);
    await expect(tool.statValue("Words")).toHaveText(String(s.words));
    await expect(tool.statValue("Characters")).toHaveText(String(s.chars));
    await expect(tool.statValue("No spaces")).toHaveText(String(s.charsNoSpaces));
    await expect(tool.statValue("Sentences")).toHaveText(String(s.sentences));
    await expect(tool.statValue("Paragraphs")).toHaveText(String(s.paragraphs));
    await expect(tool.statValue("Lines")).toHaveText(String(s.lines));
    await expect(tool.statValue("Read time")).toHaveText(`~${s.readingTime} min`);
  });

  test("пустой текст даёт нули, а не NaN/мусор", async () => {
    await tool.setText("");
    await expect(tool.statValue("Words")).toHaveText("0");
    await expect(tool.statValue("Sentences")).toHaveText("0");
    await expect(tool.statValue("Paragraphs")).toHaveText("0");
    // Пустая строка — всё ещё "одна строка" по split("\n"), а не ноль.
    await expect(tool.statValue("Lines")).toHaveText("1");
  });

  test("многострочный текст с абзацами считает всё согласованно", async () => {
    const text = "Line one.\nLine two.\n\nSecond paragraph here. It has two sentences!\n\n\nThird paragraph.";
    await tool.setText(text);
    const s = computeStats(text);
    await expect(tool.statValue("Words")).toHaveText(String(s.words));
    await expect(tool.statValue("Sentences")).toHaveText(String(s.sentences));
    await expect(tool.statValue("Paragraphs")).toHaveText(String(s.paragraphs));
    await expect(tool.statValue("Lines")).toHaveText(String(s.lines));
  });

  test("время чтения округляется вверх и не бывает меньше 1 минуты", async () => {
    // 250 слов при 200 словах/мин → 1.25, округляется вверх до 2.
    const text = Array(250).fill("word").join(" ");
    await tool.setText(text);
    await expect(tool.statValue("Read time")).toHaveText("~2 min");

    // Одно слово — всё равно не меньше "~1 min", а не "~0 min".
    await tool.setText("word");
    await expect(tool.statValue("Read time")).toHaveText("~1 min");
  });
});
