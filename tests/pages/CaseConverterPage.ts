import { Page, Locator } from "@playwright/test";

export class CaseConverterPage {
  readonly page:   Page;
  readonly input:  Locator;
  readonly output: Locator;

  constructor(page: Page) {
    this.page = page;
    this.input  = page.locator("textarea");
    this.output = page.locator("p.font-mono.text-sm.text-text-primary");
  }

  async goto() {
    await this.page.goto("/en/tools/case-converter");
  }

  async setInput(value: string) {
    await this.input.fill(value);
  }

  /** Кнопка конкретного регистра, например "camelCase" или "snake_case". */
  caseButton(label: string): Locator {
    return this.page.getByRole("button", { name: label, exact: true });
  }
}
