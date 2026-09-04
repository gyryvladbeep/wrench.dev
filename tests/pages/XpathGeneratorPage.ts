import { Page, Locator, expect } from "@playwright/test";

/**
 * Page Object для XPath Generator.
 *
 * Важный нюанс этого инструмента (в отличие от Regex Tester): поле
 * ввода не пустое при загрузке страницы — компонент инициализирует
 * useState() значением плейсхолдера, так что textarea сразу содержит
 * пример HTML. Поэтому "открывается с примером по умолчанию" здесь
 * означает буквально дефолтное значение стейта, а не HTML-атрибут
 * placeholder (тот был бы виден только на пустом поле).
 */
export class XpathGeneratorPage {
  readonly page: Page;

  readonly htmlInput:      Locator;
  readonly generateButton: Locator;
  readonly copyAllButton:  Locator;
  readonly emptyHint:      Locator;
  // Значения результатов рендерятся как <p class="font-mono ..."> внутри
  // блоков .code-surface. У textarea ввода тоже есть класс font-mono,
  // но это <textarea>, а не <p> — поэтому селектор ниже не путает
  // поле ввода с результатами.
  readonly resultValues:   Locator;

  constructor(page: Page) {
    this.page = page;
    this.htmlInput      = page.locator("#xpath-input");
    this.generateButton = page.getByRole("button", { name: "Generate XPaths" });
    this.copyAllButton   = page.getByRole("button", { name: "Copy all" });
    this.emptyHint       = page.getByText("Paste HTML above and click Generate.");
    this.resultValues    = page.locator(".code-surface p.font-mono");
  }

  async goto() {
    await this.page.goto("/en/tools/xpath-generator");
  }

  async setHtml(html: string) {
    // fill() сначала очищает поле, так что предыдущее значение
    // (дефолтный пример) полностью заменяется — не дописывается.
    await this.htmlInput.fill(html);
  }

  async generate() {
    await this.generateButton.click();
  }

  async expectResultCount(count: number) {
    await expect(this.resultValues).toHaveCount(count);
  }

  // Возвращает текст всех сгенерированных XPath-значений по порядку —
  // так тест может свериться сразу со всем списком одним expect(),
  // вместо того чтобы проверять каждую строку через getByText
  // (что было бы хрупко для строк со спецсимволами вроде // и [@id]).
  async getResultTexts(): Promise<string[]> {
    return this.resultValues.allTextContents();
  }
}