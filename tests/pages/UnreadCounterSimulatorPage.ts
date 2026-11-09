import { Page, Locator } from "@playwright/test";
import { waitForHydration } from "./hydration";

/** Page Object для /tools/unread-counter-simulator (components/tools/UnreadCounterSimulatorTool.tsx). */
export class UnreadCounterSimulatorPage {
  readonly page: Page;
  readonly events: Locator;
  readonly cap: Locator;
  readonly muted: Locator;
  readonly steps: Locator;
  readonly channels: Locator;
  readonly error: Locator;

  constructor(page: Page) {
    this.page = page;
    this.events = page.getByLabel("Events: JSON array or NDJSON", { exact: true });
    this.cap = page.getByLabel("Badge cap", { exact: true });
    this.muted = page.getByLabel("Muted channels count toward the total badge", { exact: true });
    this.steps = page.getByTestId("uc-steps").locator("tbody tr");
    this.channels = page.getByTestId("uc-channels").locator("tbody tr");
    this.error = page.getByTestId("uc-error");
  }

  async goto() {
    await this.page.goto("/en/tools/unread-counter-simulator");
    await waitForHydration(this.events);
  }

  stat(id: string): Locator {
    return this.page.getByTestId(id).locator("div").last();
  }

  channel(name: string): Locator {
    return this.page.getByTestId("uc-channels").locator(`tr[data-channel="${name}"]`);
  }
}
