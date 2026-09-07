import { Page, Locator } from "@playwright/test";
import { fillRobust } from "../support/robust-fill";

/** Page Object для /tools/html-to-markdown (components/tools/HtmlToMarkdownTool.tsx). */
export class HtmlToMarkdownPage {
  readonly page: Page;
  readonly input: Locator;
  readonly output: Locator; // readonly textarea, скрыт пока result.value === ""

  constructor(page: Page) {
    this.page = page;
    this.input = page.locator("textarea:not([readonly])");
    this.output = page.locator("textarea[readonly]");
  }

  async goto() {
    await this.page.goto("/en/tools/html-to-markdown");
  }

  async setInput(html: string) {
    await fillRobust(this.input, html);
  }
}
