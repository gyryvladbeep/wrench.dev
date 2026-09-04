import { test, expect } from "@playwright/test";
import { CssSelectorGeneratorPage } from "./pages/CssSelectorGeneratorPage";

test.describe("CSS Selector Generator", () => {

  let cssTool: CssSelectorGeneratorPage;

  test.beforeEach(async ({ page }) => {
    cssTool = new CssSelectorGeneratorPage(page);
    await cssTool.goto();
  });

  test("страница открывается с примером HTML во входном поле", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("CSS Selector Generator");
    await expect(cssTool.htmlInput).toHaveValue(
      '<div id="main"><button class="btn primary">Submit</button></div>'
    );
  });

  test("генерация селекторов для примера по умолчанию даёт 3 предсказуемых варианта", async () => {
    // Просчитано вручную по getCssSelectors() в CssSelectorGeneratorTool.tsx:
    //  - div#main:  есть id → "#main" (класса и нужных атрибутов у div нет)
    //  - button:    есть 2 класса → "button.btn.primary" и первый класс ".btn"
    //               (у button нет id и нет отслеживаемых атрибутов type/name/...)
    // Оба элемента — единственные дети своего родителя, поэтому
    // nth-of-type здесь не добавляется (условие siblings.length > 1).
    await cssTool.generate();

    await cssTool.expectResultCount(3);
    await expect(cssTool.getResultTexts()).resolves.toEqual([
      "#main",
      "button.btn.primary",
      ".btn",
    ]);
  });

  test("атрибутные селекторы генерируются для type / placeholder / data-testid", async () => {
    // Инструмент отслеживает фиксированный список атрибутов (см. массив
    // attrs в коде): type, name, placeholder, href, src, role,
    // aria-label, data-testid. У этого input нет id и class, поэтому
    // единственный источник селекторов — атрибуты, и порядок результатов
    // будет ровно таким, в каком атрибуты перечислены в этом массиве.
    await cssTool.setHtml('<input type="email" placeholder="you@example.com" data-testid="email-field" />');
    await cssTool.generate();

    await cssTool.expectResultCount(3);
    await expect(cssTool.getResultTexts()).resolves.toEqual([
      'input[type="email"]',
      'input[placeholder="you@example.com"]',
      'input[data-testid="email-field"]',
    ]);
  });

  test("одинаковые соседние теги дают Tag-фолбэк для родителя и nth-of-type для детей", async () => {
    // Граничный случай на дубликаты тегов: три <li> без id/class/атрибутов
    // внутри <ul> без id/class. У <ul> единственный потомок его типа —
    // фолбэк на голый тег "ul". У каждого <li> есть братья того же тега
    // (siblings.length === 3 > 1) → добавляется li:nth-of-type(N).
    await cssTool.setHtml("<ul><li>One</li><li>Two</li><li>Three</li></ul>");
    await cssTool.generate();

    await cssTool.expectResultCount(4);
    await expect(cssTool.getResultTexts()).resolves.toEqual([
      "ul",
      "li:nth-of-type(1)",
      "li:nth-of-type(2)",
      "li:nth-of-type(3)",
    ]);
  });

  test("пустое поле не даёт результатов и показывает подсказку", async () => {
    await cssTool.setHtml("");
    await cssTool.generate();

    await cssTool.expectResultCount(0);
    await expect(cssTool.emptyHint).toBeVisible();
  });

});