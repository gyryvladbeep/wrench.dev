import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/rot13 (components/tools/EncodingTools.tsx,
 *  Rot13Tool). Без режимов — ROT13 сам себе обратная операция. */
export class Rot13Page {
  readonly page: Page;
  readonly input:  Locator;
  readonly output: Locator;

  constructor(page: Page) {
    this.page = page;
    this.input  = page.locator("textarea").first();
    this.output = page.locator("textarea").nth(1);
  }

  async goto() {
    await this.page.goto("/en/tools/rot13");
  }

  async setInput(value: string) {
    await this.input.fill(value);
  }
}
