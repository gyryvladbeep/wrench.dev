import { Page, Locator } from "@playwright/test";
import { waitForHydration } from "./hydration";

/** Page Object для /tools/shortcut-conflict-checker (components/tools/ShortcutConflictCheckerTool.tsx). */
export class ShortcutConflictCheckerPage {
  readonly page: Page;
  readonly input: Locator;
  readonly errors: Locator;

  constructor(page: Page) {
    this.page = page;
    this.input = page.getByLabel("App shortcuts", { exact: true });
    this.errors = page.getByTestId("sk-errors");
  }

  async goto() {
    await this.page.goto("/en/tools/shortcut-conflict-checker");
    await waitForHydration(this.input);
  }

  stat(id: string): Locator {
    return this.page.getByTestId(id).locator("div").last();
  }

  finding(code: string): Locator {
    return this.page.getByTestId("sk-findings").locator(`[data-code="${code}"]`).first();
  }
}
