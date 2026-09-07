import { Page, Locator } from "@playwright/test";
import { fillRobust } from "../support/robust-fill";

/** Page Object для /tools/json-compare (components/tools/JsonCompareTool.tsx). */
export class JsonComparePage {
  readonly page: Page;
  readonly left: Locator;
  readonly right: Locator;
  readonly summary: Locator;   // "✓ Identical" / "N difference(s) found"
  readonly invalidMessage: Locator;
  readonly rows: Locator;      // все строки диффа (в т.ч. "same")

  constructor(page: Page) {
    this.page = page;
    this.left = page.locator("textarea").nth(0);
    this.right = page.locator("textarea").nth(1);
    this.summary = page.locator("p.mb-3.text-sm.text-text-muted");
    this.invalidMessage = page.getByText("Invalid JSON in one or both inputs.");
    this.rows = page.locator("div.grid.grid-cols-3");
  }

  async goto() {
    await this.page.goto("/en/tools/json-compare");
  }

  async setLeft(json: string) {
    await fillRobust(this.left, json);
  }

  async setRight(json: string) {
    await fillRobust(this.right, json);
  }

  /** Строка диффа по ключу (первый <span> в строке). */
  rowByKey(key: string): Locator {
    return this.rows.filter({ has: this.page.locator(`span.truncate.text-text-primary`, { hasText: key } ) });
  }
}
