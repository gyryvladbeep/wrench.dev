import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/slug-generator (components/tools/TextTools.tsx,
 *  SlugGeneratorTool). Единственный input на странице — можно брать
 *  без уточнения типа. */
export class SlugGeneratorPage {
  readonly page: Page;
  readonly hyphenButton:     Locator;
  readonly underscoreButton: Locator;
  readonly input:  Locator;
  readonly output: Locator;

  constructor(page: Page) {
    this.page = page;
    this.hyphenButton     = page.getByRole("button", { name: "hyphen-case" });
    this.underscoreButton = page.getByRole("button", { name: "underscore_case" });
    this.input  = page.locator("input");
    // Результат — не input/textarea, а <p> с моно-шрифтом внутри
    // code-surface блока (см. JSX).
    this.output = page.locator("p.font-mono.text-accent");
  }

  async goto() {
    await this.page.goto("/en/tools/slug-generator");
  }

  async setInput(value: string) {
    await this.input.fill(value);
  }
}
