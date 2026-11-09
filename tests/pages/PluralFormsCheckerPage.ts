import { Page, Locator } from "@playwright/test";
import { waitForHydration } from "./hydration";

/** Page Object для /tools/plural-forms-checker (components/tools/PluralFormsCheckerTool.tsx). */
export class PluralFormsCheckerPage {
  readonly page: Page;
  readonly locale: Locator;
  readonly numbers: Locator;
  readonly templates: Locator;
  readonly categories: Locator;
  readonly missing: Locator;

  constructor(page: Page) {
    this.page = page;
    this.locale = page.getByLabel("Language", { exact: true });
    this.numbers = page.getByLabel("Numbers to preview", { exact: true });
    this.templates = page.getByLabel("Templates: category: text with {n}", { exact: true });
    this.categories = page.getByTestId("pf-categories");
    this.missing = page.getByTestId("pf-missing");
  }

  async goto() {
    await this.page.goto("/en/tools/plural-forms-checker");
    await waitForHydration(this.templates);
  }

  row(n: number): Locator {
    return this.page.getByTestId("pf-preview").locator(`tr[data-n="${n}"]`).first();
  }

  range(from: number, to: number): Locator {
    return this.page.getByTestId("pf-ranges").locator(`li[data-from="${from}"][data-to="${to}"]`);
  }
}
