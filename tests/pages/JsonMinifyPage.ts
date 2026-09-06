import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/json-minify (components/tools/JsonMinifyTool.tsx). */
export class JsonMinifyPage {
  readonly page: Page;
  readonly input:  Locator;
  readonly output: Locator;
  // "N% smaller" рендерится только когда результат валиден и непустой.
  readonly savedBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.input  = page.locator("textarea").first();
    this.output = page.locator("textarea").nth(1);
    this.savedBadge = page.getByText(/^\d+% smaller$/);
  }

  async goto() {
    await this.page.goto("/en/tools/json-minify");
  }

  async setInput(value: string) {
    await this.input.fill(value);
  }
}
