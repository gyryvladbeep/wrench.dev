import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/loot-table-validator (components/tools/LootTableValidatorTool.tsx). */
export class LootTableValidatorPage {
  readonly page: Page;
  readonly nameInputs: Locator;
  readonly rollCountInput: Locator;
  readonly simulateButton: Locator;
  readonly addItemButton: Locator;
  readonly totalWeightText: Locator;
  readonly resultsTable: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInputs = page.locator('input[placeholder="Item name"]');
    this.rollCountInput = this.byLabel("Roll count");
    this.simulateButton = page.getByRole("button", { name: "Run simulation" });
    this.addItemButton  = page.getByRole("button", { name: "+ Add item" });
    this.totalWeightText = page.getByText(/Total weight: \d+/);
    this.resultsTable = page.locator("table");
  }

  private byLabel(label: string): Locator {
    return this.page.getByText(label, { exact: true }).locator("xpath=following-sibling::input[1]");
  }

  async goto() {
    await this.page.goto("/en/tools/loot-table-validator");
  }

  weightInput(rowIndex: number): Locator {
    return this.nameInputs.nth(rowIndex).locator("xpath=following-sibling::input[1]");
  }

  removeButton(rowIndex: number): Locator {
    return this.nameInputs.nth(rowIndex).locator("xpath=following-sibling::button[1]");
  }

  async setRollCount(n: number) {
    await this.rollCountInput.fill(String(n));
  }

  async simulate() {
    await this.simulateButton.click();
  }

  expectedPctCell(itemName: string): Locator {
    return this.resultsTable.locator("tr", { hasText: itemName }).locator("td").nth(1);
  }

  rolledCell(itemName: string): Locator {
    return this.resultsTable.locator("tr", { hasText: itemName }).locator("td").nth(3);
  }
}
