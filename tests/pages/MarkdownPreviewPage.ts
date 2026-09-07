import { Page, Locator } from "@playwright/test";
import { fillRobust, clickRobust } from "../support/robust-fill";

/** Page Object для /tools/markdown-preview (components/tools/MarkdownPreviewTool.tsx). */
export class MarkdownPreviewPage {
  readonly page: Page;
  readonly input: Locator;
  readonly previewPane: Locator;
  readonly splitButton: Locator;
  readonly sourceButton: Locator;
  readonly previewButton: Locator;
  readonly copyHtmlButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.input = page.locator("textarea");
    this.previewPane = page.locator("div.prose");
    this.splitButton = page.getByRole("button", { name: "Split", exact: true });
    this.sourceButton = page.getByRole("button", { name: "Markdown", exact: true });
    this.previewButton = page.getByRole("button", { name: "Preview", exact: true });
    this.copyHtmlButton = page.getByRole("button", { name: "Copy HTML" });
  }

  async goto() {
    // Дефолтный вид — "split", поэтому textarea сразу доступна.
    await this.page.goto("/en/tools/markdown-preview");
  }

  async setInput(md: string) {
    await fillRobust(this.input, md);
  }

  async switchView(view: "split" | "source" | "preview") {
    const button = view === "split" ? this.splitButton : view === "source" ? this.sourceButton : this.previewButton;
    await clickRobust(button, async () => {
      if (view === "preview") await this.previewPane.waitFor({ state: "visible", timeout: 1500 });
      if (view === "source") await this.previewPane.waitFor({ state: "hidden", timeout: 1500 });
    });
  }
}
