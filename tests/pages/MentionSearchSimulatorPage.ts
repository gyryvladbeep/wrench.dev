import { Page, Locator } from "@playwright/test";
import { waitForHydration } from "./hydration";

/** Page Object для /tools/mention-search-simulator (components/tools/MentionSearchSimulatorTool.tsx). */
export class MentionSearchSimulatorPage {
  readonly page: Page;
  readonly people: Locator;
  readonly query: Locator;
  readonly rows: Locator;
  readonly empty: Locator;
  readonly normalized: Locator;

  constructor(page: Page) {
    this.page = page;
    this.people = page.getByLabel("People: username | name, one per line", { exact: true });
    this.query = page.getByLabel("Query after @", { exact: true });
    this.rows = page.getByTestId("ms-results").locator("tbody tr");
    this.empty = page.getByTestId("ms-empty");
    this.normalized = page.getByTestId("ms-normalized");
  }

  async goto() {
    await this.page.goto("/en/tools/mention-search-simulator");
    await waitForHydration(this.people);
  }
}
