import { test, expect } from "@playwright/test";

/**
 * ═══════════════════════════════════════════════════════════════
 * УРОВЕНЬ 3 — ПАРАМЕТРИЗОВАННЫЕ ТЕСТЫ (DATA-DRIVEN TESTING)
 * ═══════════════════════════════════════════════════════════════
 *
 * ПРОБЛЕМА: представь что нужно проверить регулярку на 5 разных
 * примерах текста. Можно скопировать один test() пять раз и поменять
 * данные внутри — но это плохо: если нужно поменять логику проверки,
 * придётся чинить её в пяти местах. И такой код тяжело читать.
 *
 * РЕШЕНИЕ: складываем тестовые данные в МАССИВ, затем прогоняем ОДИН
 * тест-шаблон в цикле for...of по этому массиву. Это называется
 * "параметризация" или "data-driven testing" — стандартная техника
 * в любом фреймворке автоматизации (в Java/JUnit это @ParameterizedTest,
 * в Python/pytest — @pytest.mark.parametrize).
 *
 * Огромный плюс: чтобы добавить ещё один тест-кейс, не нужно писать
 * новый test() — просто добавляешь одну строку в массив данных.
 */

test.describe("Regex Tester", () => {

  test.beforeEach(async ({ page }) => {
    await page.goto("/en/tools/regex-tester");
  });

  test("страница инструмента открывается с примером по умолчанию", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Regex Tester");

    // Проверяем что поле паттерна не пустое — на странице уже есть
    // демо-пример при первой загрузке
    const pattern = page.locator("#regex-pattern");
    await expect(pattern).not.toHaveValue("");
  });

  // ─────────────────────────────────────────────────────────────
  // МАССИВ ТЕСТОВЫХ ДАННЫХ
  // ─────────────────────────────────────────────────────────────
  // Каждый объект — это один тест-кейс: какой паттерн, какая строка,
  // и сколько совпадений мы ОЖИДАЕМ увидеть.
  const regexCases = [
    {
      name:      "простое число",
      pattern:   "\\d+",
      testString:"У меня 3 кота и 12 рыбок",
      expectedMatches: 2,   // "3" и "12"
    },
    {
      name:      "email адрес",
      pattern:   "\\w+@\\w+\\.\\w+",
      testString:"Пиши на support@wrench.dev или sales@wrench.dev",
      expectedMatches: 2,
    },
    {
      name:      "слово 'cat' без учёта регистра",
      pattern:   "cat",
      testString:"Cat, cat, CAT — three cats in a row",
      expectedMatches: 4,   // Cat, cat, CAT, cats(частичное совпадение "cat" внутри "cats")
    },
    {
      name:      "паттерн без совпадений",
      pattern:   "xyz123",
      testString:"Здесь такого текста точно нет",
      expectedMatches: 0,
    },
  ];

  // for...of проходит по каждому элементу массива regexCases.
  // Для КАЖДОГО элемента создаётся ОТДЕЛЬНЫЙ test() — в отчёте
  // Playwright они будут показаны как разные строки с разными именами.
  for (const testCase of regexCases) {
    test(`подсчёт совпадений: ${testCase.name}`, async ({ page }) => {
      // Заполняем оба поля данными из текущего элемента массива
      await page.locator("#regex-pattern").fill(testCase.pattern);
      await page.locator("#regex-test-string").fill(testCase.testString);

      // ─────────────────────────────────────────────────────────
      // УРОК: не угадывай поведение приложения — проверяй
      // ─────────────────────────────────────────────────────────
      // Первая версия этого теста предполагала, что при 0 совпадений
      // счётчик вообще скроется с экрана. Открыв скриншот падения,
      // увидели: на самом деле компонент показывает явный текст
      // "0 matches" — тоже правильное поведение приложения, просто
      // отличается от нашего предположения. Тест должен проверять
      // РЕАЛЬНОЕ поведение, а не то, что кажется логичным разработчику
      // теста.
      const expectedText = testCase.expectedMatches === 1
        ? `${testCase.expectedMatches} match`
        : `${testCase.expectedMatches} matches`;

      await expect(page.getByText(expectedText, { exact: true })).toBeVisible();
    });
  }

  test("невалидный regex паттерн показывает ошибку", async ({ page }) => {
    // Специально ломаем паттерн — незакрытая скобка
    await page.locator("#regex-pattern").fill("(unclosed");

    // Здесь применяем тот же урок что и в JSON Formatter:
    // не проверяем точный текст ошибки от движка регулярок,
    // проверяем только что ошибка вообще появилась
    const errorBox = page.locator(".text-red-400, .text-error");
    await expect(errorBox.first()).toBeVisible();
  });

  test("флаг 'i' (без учёта регистра) меняет количество совпадений", async ({ page }) => {
    await test.step("вводим паттерн БЕЗ флага i — регистр важен", async () => {
      await page.locator("#regex-pattern").fill("cat");
      await page.locator("#regex-test-string").fill("Cat CAT cat");

      // Снимаем флаг "i", если он включён по умолчанию
      const iCheckbox = page.getByLabel(/ignore case|i\)/i);
      if (await iCheckbox.isChecked()) {
        await iCheckbox.uncheck();
      }
    });

    await test.step("проверяем — находится только 1 совпадение (только 'cat' в нижнем регистре)", async () => {
      await expect(page.getByText("1 match")).toBeVisible();
    });

    await test.step("включаем флаг 'i' — регистр больше не важен", async () => {
      const iCheckbox = page.getByLabel(/ignore case|i\)/i);
      await iCheckbox.check();
    });

    await test.step("теперь должно найтись 3 совпадения", async () => {
      await expect(page.getByText("3 matches")).toBeVisible();
    });
  });

});