import { Page, Locator } from "@playwright/test";
import { waitForHydration } from "./hydration";

/** Page Object для /tools/virtual-list-calculator (components/tools/VirtualListCalculatorTool.tsx). */
export class VirtualListCalculatorPage {
  readonly page: Page;
  readonly count: Locator;
  readonly height: Locator;
  readonly viewport: Locator;
  readonly overscan: Locator;
  readonly scroll: Locator;
  readonly observed: Locator;
  readonly jump: Locator;
  readonly align: Locator;
  readonly added: Locator;
  readonly verdict: Locator;
  readonly jumpResult: Locator;
  readonly prependResult: Locator;
  readonly invalid: Locator;

  constructor(page: Page) {
    this.page = page;
    this.count = page.getByLabel("Messages in the list", { exact: true });
    this.height = page.getByLabel("Row height, px", { exact: true });
    this.viewport = page.getByLabel("Viewport height, px", { exact: true });
    this.overscan = page.getByLabel("Overscan, rows each side", { exact: true });
    this.scroll = page.getByLabel("Scroll position, px", { exact: true });
    this.observed = page.getByLabel("Rows actually in the DOM", { exact: true });
    this.jump = page.getByLabel("Jump to row", { exact: true });
    this.align = page.getByLabel("Alignment", { exact: true });
    this.added = page.getByLabel("Rows loaded above", { exact: true });
    this.verdict = page.getByTestId("vl-verdict");
    this.jumpResult = page.getByTestId("vl-jump-result");
    this.prependResult = page.getByTestId("vl-prepend-result");
    this.invalid = page.getByTestId("vl-invalid");
  }

  async goto() {
    await this.page.goto("/en/tools/virtual-list-calculator");
    await waitForHydration(this.count);
  }

  stat(id: string): Locator {
    return this.page.getByTestId(id).locator("div").last();
  }
}
