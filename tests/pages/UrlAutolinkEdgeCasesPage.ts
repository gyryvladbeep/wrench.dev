import { Page, Locator } from "@playwright/test";
import { waitForHydration } from "./hydration";

/** Page Object для /tools/url-autolink-edge-cases (components/tools/UrlAutolinkEdgeCasesTool.tsx). */
export class UrlAutolinkEdgeCasesPage {
  readonly page: Page;
  readonly text: Locator;
  readonly count: Locator;
  readonly rows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.text = page.getByLabel("Message text", { exact: true });
    this.count = page.getByTestId("al-count");
    this.rows = page.getByTestId("al-results").locator("tbody tr");
  }

  async goto() {
    await this.page.goto("/en/tools/url-autolink-edge-cases");
    await waitForHydration(this.text);
  }

  sample(id: string): Locator {
    return this.page.getByTestId(`al-sample-${id}`);
  }
}
