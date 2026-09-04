import { Page, Locator, expect } from "@playwright/test";

/**
 * Page Object для CSS Selector Generator.
 * Структура страницы почти идентична XPath Generator (см. комментарии
 * там) — тот же паттерн "textarea с дефолтным HTML + кнопка Generate +
 * список .code-surface результатов".
 */
export class CssSelectorGeneratorPage {
  readonly page: Page;

  readonly htmlInput:      Locator;
  readonly generateButton: Locator;
  readonly emptyHint:      Locator;
  readonly resultValues:   Locator;

  constructor(page: Page) {
    this.page = page;
    this.htmlInput      = page.locator("#css-input");
    this.generateButton = page.getByRole("button", { name: "Generate selectors" });
    this.emptyHint       = page.getByText("Paste HTML above and click Generate.");
    this.resultValues    = page.locator(".code-surface p.font-mono");
  }

  async goto() {
    await this.page.goto("/en/tools/css-selector-generator");
  }

  async setHtml(html: string) {
    await this.htmlInput.fill(html);
  }

  async generate() {
    await this.generateButton.click();
  }

  async expectResultCount(count: number) {
    await expect(this.resultValues).toHaveCount(count);
  }

  async getResultTexts(): Promise<string[]> {
    return this.resultValues.allTextContents();
  }
}