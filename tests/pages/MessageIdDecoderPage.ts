import { Page, Locator } from "@playwright/test";
import { waitForHydration } from "./hydration";

/** Page Object для /tools/message-id-decoder (components/tools/MessageIdDecoderTool.tsx). */
export class MessageIdDecoderPage {
  readonly page: Page;
  readonly ids: Locator;
  readonly summary: Locator;
  readonly rows: Locator;
  readonly feedSample: Locator;
  readonly typesSample: Locator;

  constructor(page: Page) {
    this.page = page;
    this.ids = page.getByLabel("Message IDs, one per line", { exact: true });
    this.summary = page.getByTestId("mi-summary");
    this.rows = page.getByTestId("mi-table").locator("tbody tr");
    this.feedSample = page.getByTestId("mi-sample-feed");
    this.typesSample = page.getByTestId("mi-sample-types");
  }

  async goto() {
    await this.page.goto("/en/tools/message-id-decoder");
    await waitForHydration(this.ids);
  }

  async statuses(): Promise<(string | null)[]> {
    return this.rows.evaluateAll((els) => els.map((e) => e.getAttribute("data-status")));
  }
}
