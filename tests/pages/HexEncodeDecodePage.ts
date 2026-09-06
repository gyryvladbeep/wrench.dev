import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/hex-encode-decode (components/tools/EncodingTools.tsx,
 *  HexEncodeDecodeTool). */
export class HexEncodeDecodePage {
  readonly page: Page;
  readonly encodeButton: Locator; // "Text → Hex"
  readonly decodeButton: Locator; // "Hex → Text"
  readonly input:  Locator;
  readonly output: Locator;

  constructor(page: Page) {
    this.page = page;
    this.encodeButton = page.getByRole("button", { name: "Text → Hex" });
    this.decodeButton = page.getByRole("button", { name: "Hex → Text" });
    this.input  = page.locator("textarea").first();
    this.output = page.locator("textarea").nth(1);
  }

  async goto() {
    await this.page.goto("/en/tools/hex-encode-decode");
  }

  async setInput(value: string) {
    await this.input.fill(value);
  }
}
