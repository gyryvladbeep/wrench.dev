import { test, expect } from "@playwright/test";
import { LoremIpsumPage } from "./pages/LoremIpsumPage";

// Точная копия словаря WORDS_EN из components/tools/LoremIpsumTool.tsx —
// нужен, чтобы проверить, что сгенерированные слова действительно взяты
// из этого набора (контент рандомный, поэтому проверяем структуру/множество,
// а не конкретную строку).
const WORDS_EN = ["lorem","ipsum","dolor","sit","amet","consectetur","adipiscing","elit","sed","do","eiusmod","tempor","incididunt","ut","labore","et","dolore","magna","aliqua","enim","ad","minim","veniam","quis","nostrud","exercitation","ullamco","laboris","nisi","aliquip","ex","ea","commodo","consequat","duis","aute","irure","in","reprehenderit","voluptate","velit","esse","cillum","eu","fugiat","nulla","pariatur","excepteur","sint","occaecat","cupidatat","non","proident","sunt","culpa","qui","officia","deserunt","mollit","anim","id","est","laborum"];

// Точная копия WORDS_RU из components/tools/LoremIpsumTool.tsx (после
// фикса смешанной латиницы/кириллицы — раньше 9 слов были испорчены
// случайными латинскими буквами, включая полностью непереведённое
// "pariatur"; теперь весь массив полностью кириллический).
const WORDS_RU = ["лорем","ипсум","долор","сит","амет","консектетур","адипискинг","элит","сед","до","эйусмод","темпор","инцидидунт","ут","лаборе","эт","долоре","магна","аликва","эним","ад","миним","вениам","квис","ноструд","экзерситатион","улламко","лаборис","ниси","алликвип","экс","эа","коммодо","консекват","дуис","ауте","ируре","ин","репрехендерит","волюптате","велит","ессе","чиллум","эу","фугиат","нулла","париатур","эксептеур","синт","оккаекат"];

test.describe("Lorem Ipsum Generator", () => {
  let tool: LoremIpsumPage;

  test.beforeEach(async ({ page }) => {
    tool = new LoremIpsumPage(page);
    await tool.goto();
  });

  test("по умолчанию 3 абзаца, счётчик слов/символов соответствует реальному выводу", async () => {
    const text = await tool.outputText();
    const paragraphs = text.split("\n\n").filter(Boolean);
    expect(paragraphs).toHaveLength(3);

    const expectedWords = text.split(/\s+/).length;
    const expectedChars = text.length;
    await expect(tool.counterLabel).toHaveText(`${expectedWords} words · ${expectedChars} chars`);
  });

  test("режим Words с count=10 даёт ровно 10 слов из словаря WORDS_EN", async () => {
    await tool.wordsTypeButton.click();
    await tool.setCount(10);

    const text = await tool.outputText();
    const words = text.split(/\s+/);
    expect(words).toHaveLength(10);
    for (const w of words) {
      expect(WORDS_EN).toContain(w);
    }
  });

  test("режим Sentences с count=5 даёт ровно 5 предложений, каждое с заглавной буквы и точкой", async () => {
    await tool.sentencesTypeButton.click();
    await tool.setCount(5);

    const text = await tool.outputText();
    const sentences = text.split(".").map((s) => s.trim()).filter(Boolean);
    expect(sentences).toHaveLength(5);
    for (const s of sentences) {
      expect(s[0]).toBe(s[0].toUpperCase());
    }
  });

  test("переключение на RU меняет словарь — слова берутся из WORDS_RU, латиница не просачивается (регресс на фикс смешанного текста)", async () => {
    await tool.wordsTypeButton.click();
    await tool.setCount(15);
    await tool.ruButton.click();

    const text = await tool.outputText();
    const words = text.split(/\s+/);
    expect(words).toHaveLength(15);
    for (const w of words) {
      expect(WORDS_RU).toContain(w);
      // Регресс-проверка на исправленный баг: раньше несколько "русских"
      // слов на самом деле содержали латинские буквы (ностrud, pariatur и
      // т.д.) — теперь ни одно RU-слово не должно совпадать с EN-словарём.
      expect(WORDS_EN).not.toContain(w);
    }
  });

  test("значение count зажимается в диапазон 1..50", async () => {
    await tool.wordsTypeButton.click();

    await tool.setCount(100);
    expect((await tool.outputText()).split(/\s+/)).toHaveLength(50);

    await tool.setCount(0);
    expect((await tool.outputText()).split(/\s+/)).toHaveLength(1);
  });

  test("кнопка Refresh перегенерирует текст (новый рандомный вывод)", async () => {
    await tool.wordsTypeButton.click();
    await tool.setCount(25);

    const before = await tool.outputText();
    await tool.refreshButton.click();
    const after = await tool.outputText();

    expect(after).not.toBe(before);
  });
});
