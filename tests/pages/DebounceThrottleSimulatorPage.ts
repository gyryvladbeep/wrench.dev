import { Page, Locator } from "@playwright/test";
import { waitForHydration } from "./hydration";

/** Page Object для /tools/debounce-throttle-simulator (components/tools/DebounceThrottleSimulatorTool.tsx). */
export class DebounceThrottleSimulatorPage {
  readonly page: Page;
  readonly events: Locator;
  readonly mode: Locator;
  readonly wait: Locator;
  readonly leading: Locator;
  readonly trailing: Locator;
  readonly fires: Locator;

  constructor(page: Page) {
    this.page = page;
    this.events = page.getByLabel("Event times, ms", { exact: true });
    this.mode = page.getByLabel("Mode", { exact: true });
    this.wait = page.getByLabel("Wait, ms", { exact: true });
    this.leading = page.getByLabel("leading", { exact: true });
    this.trailing = page.getByLabel("trailing", { exact: true });
    this.fires = page.getByTestId("td-fires").locator("li[data-at]");
  }

  async goto() {
    await this.page.goto("/en/tools/debounce-throttle-simulator");
    await waitForHydration(this.events);
  }

  stat(name: "events-count" | "fires-count" | "saved"): Locator {
    return this.page.getByTestId(`td-${name}`).locator("div").last();
  }
}
