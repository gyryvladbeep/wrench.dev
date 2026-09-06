import { test, expect } from "@playwright/test";
import { CaseConverterPage } from "./pages/CaseConverterPage";

const SAMPLE = "the quick brown fox jumps over the lazy dog";

test.describe("Case Converter", () => {

  let tool: CaseConverterPage;

  test.beforeEach(async ({ page }) => {
    tool = new CaseConverterPage(page);
    await tool.goto();
  });

  test("по умолчанию выбран camelCase", async () => {
    await expect(tool.output).toHaveText("theQuickBrownFoxJumpsOverTheLazyDog");
  });

  test("UPPERCASE переводит весь текст в верхний регистр, сохраняя пробелы", async () => {
    await tool.caseButton("UPPERCASE").click();
    await expect(tool.output).toHaveText(SAMPLE.toUpperCase());
  });

  test("snake_case и kebab-case склеивают слова через _ и -", async () => {
    await tool.caseButton("snake_case").click();
    await expect(tool.output).toHaveText("the_quick_brown_fox_jumps_over_the_lazy_dog");

    await tool.caseButton("kebab-case").click();
    await expect(tool.output).toHaveText("the-quick-brown-fox-jumps-over-the-lazy-dog");
  });

  test("PascalCase и CONSTANT_CASE", async () => {
    await tool.caseButton("PascalCase").click();
    await expect(tool.output).toHaveText("TheQuickBrownFoxJumpsOverTheLazyDog");

    await tool.caseButton("CONSTANT_CASE").click();
    await expect(tool.output).toHaveText("THE_QUICK_BROWN_FOX_JUMPS_OVER_THE_LAZY_DOG");
  });

  test("Title Case и Sentence case", async () => {
    await tool.caseButton("Title Case").click();
    await expect(tool.output).toHaveText("The Quick Brown Fox Jumps Over The Lazy Dog");

    await tool.caseButton("Sentence case").click();
    await expect(tool.output).toHaveText("The quick brown fox jumps over the lazy dog");
  });

  test("результат обновляется при изменении исходного текста", async () => {
    await tool.caseButton("kebab-case").click();
    await tool.setInput("Custom Input Text");
    await expect(tool.output).toHaveText("custom-input-text");
  });

});
