import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/text-to-ascii (components/tools/AsciiArtTool.tsx). */
export class AsciiArtPage {
  readonly page: Page;
  readonly input:   Locator;
  readonly output:  Locator; // <pre> с ASCII-артом
  readonly counter: Locator; // "N/20 · A-Z and 0-9 supported"

  constructor(page: Page) {
    this.page = page;
    this.input   = page.locator('input[placeholder="WRENCH"]');
    this.output  = page.locator("pre");
    this.counter = page.getByText(/\/20/);
  }

  async goto() {
    await this.page.goto("/en/tools/text-to-ascii");
  }

  async setInput(value: string) {
    await this.input.fill(value);
  }

  async outputText(): Promise<string> {
    return (await this.output.textContent()) ?? "";
  }
}
