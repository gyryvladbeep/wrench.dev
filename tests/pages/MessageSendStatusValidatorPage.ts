import { Page, Locator } from "@playwright/test";
import { waitForHydration } from "./hydration";

/** Page Object для /tools/message-send-status-validator (components/tools/MessageSendStatusValidatorTool.tsx). */
export class MessageSendStatusValidatorPage {
  readonly page: Page;
  readonly events: Locator;
  readonly idKey: Locator;
  readonly statusKey: Locator;
  readonly tsKey: Locator;
  readonly stuck: Locator;
  readonly messages: Locator;
  readonly error: Locator;

  constructor(page: Page) {
    this.page = page;
    this.events = page.getByLabel("Status events: JSON array or NDJSON", { exact: true });
    this.idKey = page.getByLabel("ID key", { exact: true });
    this.statusKey = page.getByLabel("Status key", { exact: true });
    this.tsKey = page.getByLabel("Time key", { exact: true });
    this.stuck = page.getByLabel("Stuck after, ms", { exact: true });
    this.messages = page.getByTestId("ss-messages").locator("tbody tr");
    this.error = page.getByTestId("ss-error");
  }

  async goto() {
    await this.page.goto("/en/tools/message-send-status-validator");
    await waitForHydration(this.events);
  }

  stat(id: string): Locator {
    return this.page.getByTestId(id).locator("div").last();
  }

  finding(code: string): Locator {
    return this.page.getByTestId("ss-findings").locator(`[data-code="${code}"]`).first();
  }
}
