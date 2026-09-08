import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/resolution-safezone-calculator
 *  (components/tools/ResolutionSafezoneCalculatorTool.tsx). */
export class ResolutionSafezoneCalculatorPage {
  readonly page: Page;
  readonly refWidthInput: Locator;
  readonly marginInput: Locator;
  readonly rowContainers: Locator;
  readonly addRatioButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.refWidthInput = this.byLabel("Reference width");
    this.marginInput   = this.byLabel("Safe zone margin, %");
    // Каждая строка пресета — единственный на странице div с таким набором классов.
    this.rowContainers = page.locator(
      "div.flex.flex-wrap.items-center.gap-4.rounded-lg.border.border-border.bg-surface.p-3"
    );
    this.addRatioButton = page.getByRole("button", { name: "+ Add ratio" });
  }

  private byLabel(label: string): Locator {
    return this.page.getByText(label, { exact: true }).locator("xpath=following-sibling::input[1]");
  }

  async goto() {
    await this.page.goto("/en/tools/resolution-safezone-calculator");
  }

  async setRefWidth(width: number) {
    await this.refWidthInput.fill(String(width));
  }

  async setMargin(pct: number) {
    await this.marginInput.fill(String(pct));
  }

  row(index: number): Locator {
    return this.rowContainers.nth(index);
  }

  frameText(index: number): Locator {
    return this.row(index).getByText(/^Frame: /);
  }

  safeZoneText(index: number): Locator {
    return this.row(index).getByText(/^Safe zone: /);
  }

  insetText(index: number): Locator {
    return this.row(index).getByText(/^Inset: /);
  }

  removeButton(index: number): Locator {
    return this.row(index).getByRole("button");
  }
}
