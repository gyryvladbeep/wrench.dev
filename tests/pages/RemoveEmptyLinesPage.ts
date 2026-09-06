import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/remove-empty-lines (components/tools/TextTools.tsx,
 *  RemoveEmptyLinesTool). */
export class RemoveEmptyLinesPage {
  readonly page: Page;
  readonly trimWhitespaceCheckbox: Locator;
  readonly removedCountText:       Locator;
  readonly input:  Locator;
  readonly output: Locator;

  constructor(page: Page) {
    this.page = page;
    this.trimWhitespaceCheckbox = page.getByRole("checkbox");
    // Рендерится только когда removed > 0 — см. JSX компонента. Якорный
    // regex обязателен: свободный /line.*removed/ ловит ещё и
    // SEO-описание страницы с похожими словами.
    this.removedCountText = page.getByText(/^\d+ lines? removed$/);
    this.input  = page.locator("textarea").first();
    this.output = page.locator("textarea").nth(1);
  }

  async goto() {
    await this.page.goto("/en/tools/remove-empty-lines");
  }

  async setInput(value: string) {
    await this.input.fill(value);
  }
}
