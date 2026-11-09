import { Page, Locator } from "@playwright/test";
import { waitForHydration } from "./hydration";

/** Page Object для /tools/browser-storage-quota-probe (components/tools/BrowserStorageQuotaProbeTool.tsx). */
export class BrowserStorageQuotaProbePage {
  readonly page: Page;
  readonly estimateBtn: Locator;
  readonly localBtn: Locator;
  readonly sessionBtn: Locator;
  readonly local: Locator;
  readonly session: Locator;
  readonly estimate: Locator;

  constructor(page: Page) {
    this.page = page;
    this.estimateBtn = page.getByTestId("sq-estimate-btn");
    this.localBtn = page.getByTestId("sq-local-btn");
    this.sessionBtn = page.getByTestId("sq-session-btn");
    this.local = page.getByTestId("sq-local");
    this.session = page.getByTestId("sq-session");
    this.estimate = page.locator('[data-testid="sq-estimate"], [data-testid="sq-estimate-error"]').first();
  }

  async goto() {
    await this.page.goto("/en/tools/browser-storage-quota-probe");
    await waitForHydration(this.estimateBtn);
  }
}
