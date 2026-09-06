import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/html-encode-decode
 *  (components/tools/HtmlEncodeDecodeTool.tsx). */
export class HtmlEncodeDecodePage {
  readonly page: Page;
  readonly encodeButton: Locator;
  readonly decodeButton: Locator;
  readonly input:  Locator;
  readonly output: Locator;

  constructor(page: Page) {
    this.page = page;
    this.encodeButton = page.getByRole("button", { name: "Encode" });
    this.decodeButton = page.getByRole("button", { name: "Decode" });
    this.input  = page.locator("textarea").first();
    this.output = page.locator("textarea").nth(1);
  }

  async goto() {
    await this.page.goto("/en/tools/html-encode-decode");
  }

  async setInput(value: string) {
    await this.input.fill(value);
  }
}
