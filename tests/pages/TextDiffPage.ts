import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/text-diff (components/tools/TextDiffTool.tsx). */
export class TextDiffPage {
  readonly page: Page;
  readonly leftInput:  Locator;
  readonly rightInput: Locator;
  readonly addedSummary:   Locator; // "+N added"
  readonly removedSummary: Locator; // "-N removed"
  readonly identicalBadge: Locator; // "✓ Identical" — только когда added===0 && removed===0
  // Каждая строка диффа — прямой child-div контейнера с классом code-surface
  // (единственный div с этим классом на странице — у textarea тот же класс,
  // но это другой тег).
  readonly diffRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.leftInput  = page.locator("textarea").first();
    this.rightInput = page.locator("textarea").nth(1);
    this.addedSummary   = page.getByText(/^\+\d+ added$/);
    this.removedSummary = page.getByText(/^-\d+ removed$/);
    this.identicalBadge = page.getByText("✓ Identical", { exact: true });
    this.diffRows = page.locator("div.code-surface > div");
  }

  async goto() {
    await this.page.goto("/en/tools/text-diff");
  }

  async setLeft(value: string) {
    await this.leftInput.fill(value);
  }

  async setRight(value: string) {
    await this.rightInput.fill(value);
  }

  /** [{prefix, text}] по всем строкам диффа, в порядке отображения. */
  async allRows(): Promise<{ prefix: string; text: string }[]> {
    const count = await this.diffRows.count();
    const rows: { prefix: string; text: string }[] = [];
    for (let i = 0; i < count; i++) {
      const row = this.diffRows.nth(i);
      const spans = row.locator("span");
      const prefix = (await spans.nth(0).textContent()) ?? "";
      const text = (await spans.nth(1).textContent()) ?? "";
      rows.push({ prefix, text });
    }
    return rows;
  }
}
