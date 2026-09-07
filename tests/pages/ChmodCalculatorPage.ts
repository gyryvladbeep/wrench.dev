import { Page, Locator } from "@playwright/test";

type Row = "Owner (u)" | "Group (g)" | "Others (o)";
type Perm = "Read" | "Write" | "Execute";

/** Page Object для /tools/chmod-calculator (components/tools/ChmodCalculatorTool.tsx). */
export class ChmodCalculatorPage {
  readonly page: Page;
  readonly octalValue:    Locator;
  readonly symbolicValue: Locator;
  readonly chmodCommand:  Locator;

  constructor(page: Page) {
    this.page = page;
    this.octalValue    = page.getByText("Octal", { exact: true }).locator("xpath=following-sibling::p[1]");
    this.symbolicValue = page.getByText("Symbolic", { exact: true }).locator("xpath=following-sibling::p[1]");
    this.chmodCommand  = page.getByText(/^chmod \d{3} filename$/);
  }

  async goto() {
    await this.page.goto("/en/tools/chmod-calculator");
  }

  async clickPreset(label: string) {
    await this.page.getByRole("button", { name: label }).click();
  }

  /** Чекбокс конкретного разрешения в конкретной строке (Owner/Group/Others). */
  checkbox(row: Row, perm: Perm): Locator {
    const rowDiv = this.page.getByText(row, { exact: true }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
    return rowDiv.getByText(perm, { exact: true }).locator("xpath=preceding-sibling::input[1]");
  }
}
