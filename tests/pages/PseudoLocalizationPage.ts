import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/pseudo-localization-generator (components/tools/PseudoLocalizationTool.tsx). */
export class PseudoLocalizationPage {
  readonly page: Page;
  readonly input: Locator;
  readonly output: Locator;
  readonly summary: Locator;
  readonly accents: Locator;
  readonly brackets: Locator;
  readonly rtl: Locator;
  readonly expansion: Locator;

  constructor(page: Page) {
    this.page = page;
    this.input     = page.getByLabel("UI strings (one per line)", { exact: true });
    this.output    = page.getByTestId("pseudo-output");
    this.summary   = page.getByTestId("pseudo-summary");
    this.accents   = page.getByLabel("Accented letters", { exact: true });
    this.brackets  = page.getByLabel("Edge brackets [ ]", { exact: true });
    this.rtl       = page.getByLabel("Right-to-left override (RTL)", { exact: true });
    this.expansion = page.getByLabel("Expansion, %", { exact: true });
  }

  async goto() {
    await this.page.goto("/en/tools/pseudo-localization-generator");
  }

  async setText(text: string) {
    await this.input.fill(text);
  }

  async setExpansion(percent: number) {
    await this.expansion.fill(String(percent));
  }
}
