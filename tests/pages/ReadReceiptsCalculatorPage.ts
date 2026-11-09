import { Page, Locator } from "@playwright/test";
import { waitForHydration } from "./hydration";

/** Page Object для /tools/read-receipts-calculator (components/tools/ReadReceiptsCalculatorTool.tsx). */
export class ReadReceiptsCalculatorPage {
  readonly page: Page;
  readonly members: Locator;
  readonly authors: Locator;
  readonly total: Locator;
  readonly names: Locator;
  readonly empty: Locator;

  constructor(page: Page) {
    this.page = page;
    this.members = page.getByLabel("Members and read pointers", { exact: true });
    this.authors = page.getByLabel("Authors by message number (optional)", { exact: true });
    this.total = page.getByLabel("Total messages", { exact: true });
    this.names = page.getByLabel("Names shown before 'and N others'", { exact: true });
    this.empty = page.getByTestId("rr-empty");
  }

  async goto() {
    await this.page.goto("/en/tools/read-receipts-calculator");
    await waitForHydration(this.members);
  }

  row(seq: number): Locator {
    return this.page.getByTestId("rr-rows").locator(`tr[data-seq="${seq}"]`);
  }

  note(code: string): Locator {
    return this.page.getByTestId("rr-notes").locator(`[data-code="${code}"]`);
  }
}
