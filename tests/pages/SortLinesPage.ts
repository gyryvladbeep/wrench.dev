import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/sort-lines (components/tools/TextTools.tsx,
 *  SortLinesTool). */
export class SortLinesPage {
  readonly page: Page;
  readonly azButton:             Locator;
  readonly zaButton:             Locator;
  readonly lengthButton:         Locator;
  readonly caseSensitiveCheckbox: Locator;
  readonly input:  Locator;
  readonly output: Locator;

  constructor(page: Page) {
    this.page = page;
    this.azButton     = page.getByRole("button", { name: "A → Z" });
    this.zaButton     = page.getByRole("button", { name: "Z → A" });
    this.lengthButton = page.getByRole("button", { name: "By length" });
    // Единственный чекбокс на странице.
    this.caseSensitiveCheckbox = page.getByRole("checkbox");
    // Два textarea: первое — редактируемый ввод, второе — readonly результат
    // (порядок в разметке совпадает с порядком в DOM).
    this.input  = page.locator("textarea").first();
    this.output = page.locator("textarea").nth(1);
  }

  async goto() {
    await this.page.goto("/en/tools/sort-lines");
  }

  async setInput(value: string) {
    await this.input.fill(value);
  }
}
