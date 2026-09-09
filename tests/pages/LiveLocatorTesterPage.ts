import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/live-locator-tester (components/tools/LiveLocatorTesterTool.tsx). */
export class LiveLocatorTesterPage {
  readonly page: Page;
  readonly htmlInput: Locator;
  readonly selectorInput: Locator;
  readonly cssModeButton: Locator;
  readonly xpathModeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.htmlInput = page.locator("textarea");
    this.selectorInput = page.locator('input[placeholder=".btn-primary"], input[placeholder="//button[@id=\'submit-btn\']"]');
    this.cssModeButton = page.getByRole("button", { name: "CSS", exact: true });
    this.xpathModeButton = page.getByRole("button", { name: "XPath", exact: true });
  }

  async goto() {
    await this.page.goto("/en/tools/live-locator-tester");
  }

  async setHtml(html: string) {
    await this.htmlInput.fill(html);
  }

  async setSelector(selector: string) {
    await this.selectorInput.fill(selector);
  }

  async switchToXPath() {
    await this.xpathModeButton.click();
  }

  async switchToCss() {
    await this.cssModeButton.click();
  }

  /** Число из плашки "N match(es) out of M elements" — сам счётчик, число как текст. */
  matchCountBadge(): Locator {
    return this.page.getByText(/(match|matches) out of \d+ elements/).locator("xpath=preceding-sibling::span[1]");
  }

  /** Только карточки результатов (div) — исключает <textarea class="code-surface rounded-[10px] p-3 ..."> с HTML-полем. */
  matchedElementCards(): Locator {
    return this.page.locator("div.code-surface.rounded-\\[10px\\].p-3");
  }

  errorMessage(): Locator {
    return this.page.locator(".border-red-500\\/30.bg-red-500\\/5.text-red-400");
  }
}
