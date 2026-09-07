import { Page, Locator } from "@playwright/test";
import { fillRobust } from "../support/robust-fill";

/** Page Object для /tools/sql-formatter (components/tools/SqlFormatterTool.tsx). */
export class SqlFormatterPage {
  readonly page: Page;
  readonly input: Locator;
  readonly output: Locator;
  readonly formatButton: Locator;
  readonly minifyButton: Locator;
  readonly dialectSelect: Locator;
  readonly downloadButton: Locator;
  readonly copyButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.input = page.locator("#sql-input");
    this.output = page.locator("#sql-output");
    this.formatButton = page.getByRole("button", { name: "Format", exact: true });
    this.minifyButton = page.getByRole("button", { name: "Minify", exact: true });
    this.dialectSelect = page.locator("select");
    this.downloadButton = page.getByRole("button", { name: "Download" });
    this.copyButton = page.getByRole("button", { name: "Copy", exact: true });
  }

  async goto() {
    await this.page.goto("/en/tools/sql-formatter");
  }

  async setInput(sql: string) {
    await fillRobust(this.input, sql);
  }
}
