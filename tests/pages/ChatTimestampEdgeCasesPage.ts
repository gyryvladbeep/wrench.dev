import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/chat-timestamp-edge-cases (components/tools/ChatTimestampEdgeCasesTool.tsx). */
export class ChatTimestampEdgeCasesPage {
  readonly page: Page;
  readonly message: Locator;
  readonly now: Locator;
  readonly zone: Locator;
  readonly year: Locator;
  readonly relative: Locator;
  readonly invalid: Locator;
  readonly transitions: Locator;
  readonly edges: Locator;

  constructor(page: Page) {
    this.page = page;
    this.message = page.getByLabel("Message time", { exact: true });
    this.now = page.getByLabel("Viewer's current time", { exact: true });
    this.zone = page.getByLabel("Zone for edge cases", { exact: true });
    this.year = page.getByLabel("Year", { exact: true });
    this.relative = page.getByTestId("ct-relative");
    this.invalid = page.getByTestId("ct-invalid");
    this.transitions = page.getByTestId("ct-transitions");
    this.edges = page.getByTestId("ct-edges").locator("li");
  }

  async goto() {
    await this.page.goto("/en/tools/chat-timestamp-edge-cases");
  }

  zoneRow(zone: string): Locator {
    return this.page.getByTestId("ct-table").locator(`tr[data-zone="${zone}"]`);
  }
}
