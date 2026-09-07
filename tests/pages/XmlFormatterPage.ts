import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/xml-formatter (components/tools/XmlFormatterTool.tsx). */
export class XmlFormatterPage {
  readonly page: Page;
  readonly indent2Button: Locator;
  readonly indent4Button: Locator;
  readonly input:  Locator;
  readonly output: Locator;

  constructor(page: Page) {
    this.page = page;
    this.indent2Button = page.getByRole("button", { name: "2", exact: true });
    this.indent4Button = page.getByRole("button", { name: "4", exact: true });
    this.input  = page.locator("#xml-input");
    this.output = page.locator("#xml-output");
  }

  async goto() {
    await this.page.goto("/en/tools/xml-formatter");
  }

  async setInput(value: string) {
    await this.input.fill(value);
  }
}
