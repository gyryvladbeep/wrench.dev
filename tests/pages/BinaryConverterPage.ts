import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/binary-converter (components/tools/EncodingTools.tsx,
 *  BinaryConverterTool). */
export class BinaryConverterPage {
  readonly page: Page;
  readonly encodeButton: Locator; // "Text → Binary"
  readonly decodeButton: Locator; // "Binary → Text"
  readonly input:  Locator;
  readonly output: Locator;

  constructor(page: Page) {
    this.page = page;
    this.encodeButton = page.getByRole("button", { name: "Text → Binary" });
    this.decodeButton = page.getByRole("button", { name: "Binary → Text" });
    this.input  = page.locator("textarea").first();
    this.output = page.locator("textarea").nth(1);
  }

  async goto() {
    await this.page.goto("/en/tools/binary-converter");
  }

  async setInput(value: string) {
    await this.input.fill(value);
  }
}
