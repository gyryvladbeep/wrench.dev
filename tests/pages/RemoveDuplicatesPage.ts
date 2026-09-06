import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/remove-duplicates (components/tools/TextTools.tsx,
 *  RemoveDuplicatesTool). */
export class RemoveDuplicatesPage {
  readonly page: Page;
  readonly caseSensitiveCheckbox: Locator;
  readonly removedCountText:      Locator;
  readonly input:  Locator;
  readonly output: Locator;

  constructor(page: Page) {
    this.page = page;
    this.caseSensitiveCheckbox = page.getByRole("checkbox");
    // Рендерится только когда removed > 0 — см. JSX компонента. Якорный
    // regex обязателен: обычный /duplicate/ ловит ещё и SEO-описание
    // страницы, и бейджи ключевых слов ("remove duplicate lines" и т.п.).
    this.removedCountText = page.getByText(/^\d+ duplicates? removed$/);
    this.input  = page.locator("textarea").first();
    this.output = page.locator("textarea").nth(1);
  }

  async goto() {
    await this.page.goto("/en/tools/remove-duplicates");
  }

  async setInput(value: string) {
    await this.input.fill(value);
  }
}
