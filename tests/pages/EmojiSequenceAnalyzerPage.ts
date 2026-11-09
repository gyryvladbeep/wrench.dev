import { Page, Locator } from "@playwright/test";
import { waitForHydration } from "./hydration";

/** Page Object для /tools/emoji-sequence-analyzer (components/tools/EmojiSequenceAnalyzerTool.tsx). */
export class EmojiSequenceAnalyzerPage {
  readonly page: Page;
  readonly text: Locator;
  readonly rows: Locator;
  readonly none: Locator;

  constructor(page: Page) {
    this.page = page;
    this.text = page.getByLabel("Message text", { exact: true });
    this.rows = page.getByTestId("es-rows").locator("tbody tr");
    this.none = page.getByTestId("es-none");
  }

  async goto() {
    await this.page.goto("/en/tools/emoji-sequence-analyzer");
    await waitForHydration(this.text);
  }

  stat(id: string): Locator {
    return this.page.getByTestId(id).locator("div").last();
  }

  note(code: string): Locator {
    return this.page.getByTestId("es-notes").locator(`[data-code="${code}"]`);
  }
}
