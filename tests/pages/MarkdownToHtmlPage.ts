import { Page, Locator } from "@playwright/test";
import { fillRobust, clickRobust } from "../support/robust-fill";

/** Page Object для /tools/markdown-to-html (components/tools/MarkdownToHtmlTool.tsx). */
export class MarkdownToHtmlPage {
  readonly page: Page;
  readonly input: Locator;
  readonly output: Locator;       // readonly textarea в режиме "Code"
  readonly previewPane: Locator;  // div с dangerouslySetInnerHTML в режиме "Preview"

  constructor(page: Page) {
    this.page = page;
    this.input = page.locator("textarea:not([readonly])");
    this.output = page.locator("textarea[readonly]");
    this.previewPane = page.locator("div.prose.text-text-primary");
  }

  async goto() {
    await this.page.goto("/en/tools/markdown-to-html");
  }

  async setInput(md: string) {
    await fillRobust(this.input, md);
  }

  get previewToggle(): Locator {
    return this.page.getByRole("button", { name: /^(Preview|Code)$/ });
  }

  /** toPreview=true — переключиться в режим превью; false — обратно в режим кода. */
  async togglePreview(toPreview: boolean) {
    await clickRobust(this.previewToggle, async () => {
      await this.previewPane.waitFor({ state: toPreview ? "visible" : "hidden", timeout: 1500 });
    });
  }
}
