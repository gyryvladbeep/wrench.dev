import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/touch-target-checker (components/tools/TouchTargetCheckerTool.tsx). */
export class TouchTargetCheckerPage {
  readonly page: Page;
  readonly widthInput: Locator;
  readonly heightInput: Locator;
  readonly gapInput: Locator;
  readonly unitSelect: Locator;
  readonly scaleInput: Locator;
  readonly summary: Locator;
  readonly invalid: Locator;

  constructor(page: Page) {
    this.page = page;
    this.widthInput  = page.getByLabel("Tap area width", { exact: true });
    this.heightInput = page.getByLabel("Tap area height", { exact: true });
    this.gapInput    = page.getByLabel("Gap to the neighbouring target", { exact: true });
    this.unitSelect  = page.getByLabel("Units", { exact: true });
    this.scaleInput  = page.getByLabel("Density scale (3 for xxhdpi and @3x)", { exact: true });
    this.summary     = page.getByTestId("tt-summary");
    this.invalid     = page.getByTestId("tt-invalid");
  }

  async goto() {
    await this.page.goto("/en/tools/touch-target-checker");
  }

  async setSize(width: number, height: number, gap: number) {
    await this.widthInput.fill(String(width));
    await this.heightInput.fill(String(height));
    await this.gapInput.fill(String(gap));
  }

  /** Строка правила: apple, material, wcag-aa, wcag-aaa. */
  rule(id: "apple" | "material" | "wcag-aa" | "wcag-aaa"): Locator {
    return this.page.getByTestId(`tt-${id}`);
  }
}
