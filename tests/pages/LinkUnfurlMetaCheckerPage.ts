import { Page, Locator } from "@playwright/test";
import { waitForHydration } from "./hydration";

/** Page Object для /tools/link-unfurl-meta-checker (components/tools/LinkUnfurlMetaCheckerTool.tsx). */
export class LinkUnfurlMetaCheckerPage {
  readonly page: Page;
  readonly url: Locator;
  readonly html: Locator;
  readonly preview: Locator;

  constructor(page: Page) {
    this.page = page;
    this.url = page.getByLabel("Page URL", { exact: true });
    this.html = page.getByLabel("Page HTML (the head is enough)", { exact: true });
    this.preview = page.getByTestId("lu-preview");
  }

  async goto() {
    await this.page.goto("/en/tools/link-unfurl-meta-checker");
    await waitForHydration(this.html);
  }

  finding(code: string): Locator {
    return this.page.getByTestId("lu-findings").locator(`[data-code="${code}"]`).first();
  }
}
