import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/message-formatting-corpus (components/tools/MessageFormattingCorpusTool.tsx). */
export class MessageFormattingCorpusPage {
  readonly page: Page;
  readonly search: Locator;
  readonly count: Locator;
  readonly cases: Locator;

  constructor(page: Page) {
    this.page = page;
    this.search = page.getByLabel("Search cases", { exact: true });
    this.count = page.getByTestId("corpus-count");
    this.cases = page.getByTestId("corpus-list").locator("li");
  }

  async goto() {
    await this.page.goto("/en/tools/message-formatting-corpus");
  }

  tab(id: "markdown" | "links" | "mentions" | "injection" | "layout"): Locator {
    return this.page.getByTestId(`corpus-tab-${id}`);
  }

  caseItem(id: string): Locator {
    return this.page.getByTestId(`corpus-case-${id}`);
  }
}
