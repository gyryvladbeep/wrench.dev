import { test, expect } from "@playwright/test";
import { XpathGeneratorPage } from "./pages/XpathGeneratorPage";

test.describe("XPath Generator", () => {

  let xpathTool: XpathGeneratorPage;

  test.beforeEach(async ({ page }) => {
    xpathTool = new XpathGeneratorPage(page);
    await xpathTool.goto();
  });

  test("страница открывается с примером HTML во входном поле", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("XPath Generator");
    // У этого инструмента, в отличие от Regex Tester, поле ввода не
    // пустое при загрузке — компонент кладёт пример прямо в state.
    await expect(xpathTool.htmlInput).toHaveValue(
      '<div id="main"><button class="btn primary">Submit</button></div>'
    );
    // Кнопки "Copy all" ещё нет — она появляется только после первого
    // успешного Generate (results.length > 0).
    await expect(xpathTool.copyAllButton).toBeHidden();
  });

  test("генерация XPath для примера по умолчанию даёт 4 предсказуемых варианта", async () => {
    // Здесь мы не гадаем, что вернёт функция — значения посчитаны вручную
    // по исходному коду generateXPaths() в XpathGeneratorTool.tsx:
    //  - Absolute:            "/html/body/div"          (div — первый и единственный элемент в body)
    //  - Relative:             "//div[@id='main']"       (у div есть id → getRelativeXPath берёт id)
    //  - By ID:                "//*[@id='main']"
    //  - Relative (button):    "//button[contains(@class,'btn primary')]"
    // "By class" в списке НЕТ: у div#main нет атрибута class, а условие
    // добавляет byClass только для самого firstEl (div), не для потомков.
    await xpathTool.generate();

    await xpathTool.expectResultCount(4);
    await expect(xpathTool.getResultTexts()).resolves.toEqual([
      "/html/body/div",
      "//div[@id='main']",
      "//*[@id='main']",
      "//button[contains(@class,'btn primary')]",
    ]);
    await expect(xpathTool.copyAllButton).toBeVisible();
  });

  test("элемент с единственным классом даёт совпадающие relative и by-class значения", async () => {
    // Намеренно проверяем граничный случай: когда у элемента есть только
    // один класс и нет id, Relative и By class приводят к ОДИНАКОВОЙ
    // строке (оба идут через contains(@class, ...)) — но это два разных
    // результата в списке, с разными подписями. Такой дубль — не баг,
    // а следствие того, что это два независимых способа найти элемент.
    await xpathTool.setHtml('<span class="highlight">Hi</span>');
    await xpathTool.generate();

    await xpathTool.expectResultCount(3);
    await expect(xpathTool.getResultTexts()).resolves.toEqual([
      "/html/body/span",
      "//span[contains(@class,'highlight')]",
      "//span[contains(@class,'highlight')]",
    ]);
  });

  test("HTML без элементов (просто текст) не даёт результатов и не показывает ошибку", async () => {
    // DOMParser не бросает исключение на "плохой" HTML — он всегда
    // старается распарсить что-то. Поэтому единственный способ получить
    // пустой результат — когда в body вообще нет элементов, только текст.
    await xpathTool.setHtml("просто текст, никаких тегов");
    await xpathTool.generate();

    await xpathTool.expectResultCount(0);
    await expect(xpathTool.emptyHint).toBeVisible();
    await expect(xpathTool.copyAllButton).toBeHidden();
  });

  test("очистка поля и клик по Generate не показывает результатов", async () => {
    // Другой граничный случай, чем предыдущий: здесь input.trim() === ""
    // и handleGenerate() делает ранний return, вообще не вызывая парсер.
    await xpathTool.setHtml("");
    await xpathTool.generate();

    await xpathTool.expectResultCount(0);
    await expect(xpathTool.emptyHint).toBeVisible();
  });

});