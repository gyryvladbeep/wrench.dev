import { Page, Locator } from "@playwright/test";
import { readFileSync } from "fs";

/** Page Object для /tools/chat-history-generator (components/tools/ChatHistoryGeneratorTool.tsx). */
export class ChatHistoryGeneratorPage {
  readonly page: Page;
  readonly count: Locator;
  readonly seed: Locator;
  readonly format: Locator;
  readonly preview: Locator;
  readonly downloadButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.count = page.getByLabel("Messages (up to 100000)", { exact: true });
    this.seed = page.getByLabel("Seed", { exact: true });
    this.format = page.getByLabel("Format", { exact: true });
    this.preview = page.getByTestId("ch-preview");
    this.downloadButton = page.getByTestId("ch-download");
  }

  async goto() {
    await this.page.goto("/en/tools/chat-history-generator");
  }

  stat(name: "count" | "threads" | "attachments" | "size"): Locator {
    return this.page.getByTestId(`ch-${name}`).locator("div").last();
  }

  async download(): Promise<{ name: string; text: string }> {
    const [download] = await Promise.all([this.page.waitForEvent("download"), this.downloadButton.click()]);
    return { name: download.suggestedFilename(), text: readFileSync(await download.path(), "utf8") };
  }
}
