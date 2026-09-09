import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/screenshot-diff-checker (components/tools/ScreenshotDiffCheckerTool.tsx). */
export class ScreenshotDiffCheckerPage {
  readonly page: Page;
  readonly fileInputA: Locator;
  readonly fileInputB: Locator;
  readonly compareButton: Locator;
  readonly thresholdSlider: Locator;
  readonly diffImage: Locator;

  constructor(page: Page) {
    this.page = page;
    const fileInputs = page.locator('input[type="file"]');
    this.fileInputA = fileInputs.nth(0);
    this.fileInputB = fileInputs.nth(1);
    this.compareButton = page.getByRole("button", { name: "Compare", exact: true });
    this.thresholdSlider = page.locator('input[type="range"]');
    this.diffImage = page.getByAltText("diff");
  }

  async goto() {
    await this.page.goto("/en/tools/screenshot-diff-checker");
  }

  async uploadA(path: string) {
    await this.fileInputA.setInputFiles(path);
  }

  async uploadB(path: string) {
    await this.fileInputB.setInputFiles(path);
  }

  async compare() {
    await this.compareButton.click();
  }

  async setThreshold(value: number) {
    await this.thresholdSlider.fill(String(value));
    await this.thresholdSlider.dispatchEvent("input");
    await this.thresholdSlider.dispatchEvent("change");
  }

  /** Плашка "N.NN%" с процентом отличий. */
  percentText(): Locator {
    return this.page.locator("span.font-mono.font-semibold").filter({ hasText: "%" });
  }

  pixelCountText(): Locator {
    return this.page.getByText(/of [\d,]+ pixels/);
  }

  dimensionsWarning(): Locator {
    return this.page.getByText(/dimensions differ/i);
  }
}
