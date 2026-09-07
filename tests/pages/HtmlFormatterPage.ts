import { Page, Locator } from "@playwright/test";
import { fillRobust, clickRobust } from "../support/robust-fill";

/** Page Object для /tools/html-formatter (components/tools/HtmlFormatterTool.tsx). */
export class HtmlFormatterPage {
  readonly page: Page;
  readonly input: Locator;
  readonly output: Locator;

  constructor(page: Page) {
    this.page = page;
    this.input = page.locator("#html-input");
    this.output = page.locator("#html-output");
  }

  async goto() {
    await this.page.goto("/en/tools/html-formatter");
  }

  async setInput(html: string) {
    await fillRobust(this.input, html);
  }

  indentButton(size: 2 | 4): Locator {
    return this.page.getByRole("button", { name: String(size), exact: true });
  }

  async setIndent(size: 2 | 4) {
    await clickRobust(this.indentButton(size), async () => {
      const cls = await this.indentButton(size).getAttribute("class");
      if (!cls?.includes("bg-accent")) throw new Error("indent not applied yet");
    });
  }
}
