import { Page, Locator } from "@playwright/test";
import { waitForHydration } from "./hydration";

/** Page Object для /tools/message-grouping-calculator (components/tools/MessageGroupingCalculatorTool.tsx). */
export class MessageGroupingCalculatorPage {
  readonly page: Page;
  readonly events: Locator;
  readonly windowMin: Locator;
  readonly zone: Locator;
  readonly lastRead: Locator;
  readonly blocks: Locator;
  readonly error: Locator;

  constructor(page: Page) {
    this.page = page;
    this.events = page.getByLabel("Messages: JSON array or NDJSON", { exact: true });
    this.windowMin = page.getByLabel("Group window, minutes", { exact: true });
    this.zone = page.getByLabel("Time zone", { exact: true });
    this.lastRead = page.getByLabel("Last read message number (optional)", { exact: true });
    this.blocks = page.getByTestId("mg-blocks").locator("li");
    this.error = page.getByTestId("mg-error");
  }

  async goto() {
    await this.page.goto("/en/tools/message-grouping-calculator");
    await waitForHydration(this.events);
  }

  stat(id: string): Locator {
    return this.page.getByTestId(id).locator("div").last();
  }

  kind(name: "day" | "group" | "unread"): Locator {
    return this.page.getByTestId("mg-blocks").locator(`li[data-kind="${name}"]`);
  }
}
