import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/contrast-checker (components/tools/ContrastCheckerTool.tsx). */
export class ContrastCheckerPage {
  readonly page: Page;
  readonly fgInput: Locator;
  readonly bgInput: Locator;
  readonly swapButton: Locator;
  readonly ratio: Locator;

  constructor(page: Page) {
    this.page = page;
    this.fgInput = page.locator('input[placeholder="#111827"]');
    this.bgInput = page.locator('input[placeholder="#FFFFFF"]');
    this.swapButton = page.getByTitle("Swap colors");
    // Формат "4.53:1" — вычисляется живьём при каждом изменении цвета.
    this.ratio = page.getByText(/^\d+\.\d{2}:1$/);
  }

  async goto() {
    await this.page.goto("/en/tools/contrast-checker");
  }

  async setFg(hex: string) {
    await this.fgInput.fill(hex);
  }

  async setBg(hex: string) {
    await this.bgInput.fill(hex);
  }

  async swap() {
    await this.swapButton.click();
  }

  async clickPreset(label: string) {
    await this.page.getByRole("button", { name: label }).click();
  }

  /** Строка статуса ("Pass (min 4.5)" / "Fail (min 4.5)") для одного из 4 порогов WCAG. */
  statusFor(thresholdLabel: string): Locator {
    return this.page.getByText(thresholdLabel, { exact: true }).locator("xpath=following-sibling::span[1]");
  }
}
