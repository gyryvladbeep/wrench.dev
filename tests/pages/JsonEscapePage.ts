import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/json-escape (components/tools/JsonEscapeTool.tsx). */
export class JsonEscapePage {
  readonly page: Page;
  readonly escapeButton:   Locator;
  readonly unescapeButton: Locator;
  readonly input:  Locator;
  readonly output: Locator;

  constructor(page: Page) {
    this.page = page;
    this.escapeButton   = page.getByRole("button", { name: "Escape" });
    this.unescapeButton = page.getByRole("button", { name: "Unescape" });
    this.input  = page.locator("textarea").first();
    this.output = page.locator("textarea").nth(1);
  }

  async goto() {
    await this.page.goto("/en/tools/json-escape");
  }

  async setInput(value: string) {
    await this.input.fill(value);
  }
}
