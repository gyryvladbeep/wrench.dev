import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/json-sort (components/tools/JsonSortTool.tsx). */
export class JsonSortPage {
  readonly page: Page;
  readonly input:  Locator;
  readonly output: Locator;
  readonly indent2Button: Locator;
  readonly indent4Button: Locator;

  constructor(page: Page) {
    this.page = page;
    this.input  = page.locator("textarea").first();
    this.output = page.locator("textarea").nth(1);
    this.indent2Button = page.getByRole("button", { name: "2", exact: true });
    this.indent4Button = page.getByRole("button", { name: "4", exact: true });
  }

  async goto() {
    await this.page.goto("/en/tools/json-sort");
  }

  async setInput(value: string) {
    await this.input.fill(value);
  }
}
