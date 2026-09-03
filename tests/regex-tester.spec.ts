import { test, expect } from "@playwright/test";
import { RegexTesterPage } from "./pages/RegexTesterPage";

test.describe("Regex Tester", () => {

  let regexTester: RegexTesterPage;

  test.beforeEach(async ({ page }) => {
    regexTester = new RegexTesterPage(page);
    await regexTester.goto();
  });

  test("страница инструмента открывается с примером по умолчанию", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Regex Tester");
    await expect(regexTester.patternInput).not.toHaveValue("");
  });

  const regexCases = [
    { name: "простое число",                    pattern: "\\d+",             testString: "У меня 3 кота и 12 рыбок",                          expectedMatches: 2 },
    { name: "email адрес",                       pattern: "\\w+@\\w+\\.\\w+", testString: "Пиши на support@wrench.dev или sales@wrench.dev",   expectedMatches: 2 },
    { name: "слово 'cat' без учёта регистра",     pattern: "cat",              testString: "Cat, cat, CAT — three cats in a row",               expectedMatches: 4 },
    { name: "паттерн без совпадений",             pattern: "xyz123",           testString: "Здесь такого текста точно нет",                     expectedMatches: 0 },
  ];

  for (const testCase of regexCases) {
    test(`подсчёт совпадений: ${testCase.name}`, async () => {
      await regexTester.setPattern(testCase.pattern);
      await regexTester.setTestString(testCase.testString);
      await regexTester.expectMatchCount(testCase.expectedMatches);
    });
  }

  test("невалидный regex паттерн показывает ошибку", async () => {
    await regexTester.setPattern("(unclosed");
    await expect(regexTester.errorBox).toBeVisible();
  });

  test("флаг 'i' (без учёта регистра) меняет количество совпадений", async () => {
    await test.step("вводим паттерн БЕЗ флага i — регистр важен", async () => {
      await regexTester.setPattern("cat");
      await regexTester.setTestString("Cat CAT cat");

      const iCheckbox = regexTester.flagCheckbox(/ignore case|i\)/i);
      if (await iCheckbox.isChecked()) {
        await iCheckbox.uncheck();
      }
    });

    await test.step("проверяем — находится только 1 совпадение", async () => {
      await regexTester.expectMatchCount(1);
    });

    await test.step("включаем флаг 'i'", async () => {
      await regexTester.flagCheckbox(/ignore case|i\)/i).check();
    });

    await test.step("теперь должно найтись 3 совпадения", async () => {
      await regexTester.expectMatchCount(3);
    });
  });

});