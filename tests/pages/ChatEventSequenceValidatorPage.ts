import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/chat-event-sequence-validator (components/tools/ChatEventSequenceValidatorTool.tsx). */
export class ChatEventSequenceValidatorPage {
  readonly page: Page;
  readonly events: Locator;
  readonly idKey: Locator;
  readonly seqKey: Locator;
  readonly tsKey: Locator;
  readonly groupKey: Locator;
  readonly findings: Locator;
  readonly error: Locator;

  constructor(page: Page) {
    this.page = page;
    this.events = page.getByLabel("Events: JSON array or NDJSON", { exact: true });
    this.idKey = page.getByLabel("ID key", { exact: true });
    this.seqKey = page.getByLabel("Sequence key", { exact: true });
    this.tsKey = page.getByLabel("Timestamp key", { exact: true });
    this.groupKey = page.getByLabel("Group key", { exact: true });
    this.findings = page.getByTestId("sv-findings").locator("li");
    this.error = page.getByTestId("sv-error");
  }

  async goto() {
    await this.page.goto("/en/tools/chat-event-sequence-validator");
  }

  stat(name: "total" | "groups" | "issues"): Locator {
    return this.page.getByTestId(`sv-${name}`).locator("div").last();
  }

  finding(code: string): Locator {
    return this.page.getByTestId("sv-findings").locator(`[data-code="${code}"]`);
  }
}
