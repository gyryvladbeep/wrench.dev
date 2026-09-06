import { Page, Locator } from "@playwright/test";

export class HashGeneratorPage {
  readonly page:  Page;
  readonly input: Locator;

  constructor(page: Page) {
    this.page = page;
    this.input = page.locator("textarea");
  }

  async goto() {
    await this.page.goto("/en/tools/hash-generator");
  }

  async setInput(value: string) {
    await this.input.fill(value);
  }

  /** Абзац со значением хэша внутри блока конкретного алгоритма
   *  ("MD5" | "SHA-1" | "SHA-256" | "SHA-512"). */
  hashValue(algoLabel: "MD5" | "SHA-1" | "SHA-256" | "SHA-512"): Locator {
    return this.page
      .locator("div.code-surface")
      .filter({ has: this.page.getByText(algoLabel, { exact: true }) })
      .locator("p");
  }
}
