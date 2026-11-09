import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/reconnect-backoff-calculator (components/tools/ReconnectBackoffCalculatorTool.tsx). */
export class ReconnectBackoffCalculatorPage {
  readonly page: Page;
  readonly base: Locator;
  readonly factor: Locator;
  readonly max: Locator;
  readonly attempts: Locator;
  readonly jitter: Locator;
  readonly seed: Locator;
  readonly rows: Locator;
  readonly invalid: Locator;

  constructor(page: Page) {
    this.page = page;
    this.base = page.getByLabel("Base delay, ms", { exact: true });
    this.factor = page.getByLabel("Factor", { exact: true });
    this.max = page.getByLabel("Max delay, ms", { exact: true });
    this.attempts = page.getByLabel("Attempts", { exact: true });
    this.jitter = page.getByLabel("Jitter", { exact: true });
    this.seed = page.getByLabel("Sample seed", { exact: true });
    this.rows = page.getByTestId("bo-table").locator("tbody tr");
    this.invalid = page.getByTestId("bo-invalid");
  }

  async goto() {
    await this.page.goto("/en/tools/reconnect-backoff-calculator");
  }

  row(attempt: number): Locator {
    return this.page.getByTestId("bo-table").locator(`tr[data-attempt="${attempt}"]`);
  }

  stat(name: "capped" | "total-max" | "total-min"): Locator {
    return this.page.getByTestId(`bo-${name}`).locator("div").last();
  }
}
