import { Page, Locator } from "@playwright/test";
import { fillRobust } from "../support/robust-fill";

/** Page Object для /tools/boundary-value-generator (components/tools/BoundaryValueTool.tsx). */
export class BoundaryValuePage {
  readonly page: Page;
  readonly minInput: Locator;
  readonly maxInput: Locator;
  readonly resultRows: Locator;
  readonly copyButton: Locator;
  readonly noResultsHint: Locator;

  constructor(page: Page) {
    this.page = page;
    const numberInputs = page.locator('input[type="number"]');
    this.minInput = numberInputs.nth(0);
    this.maxInput = numberInputs.nth(1);
    this.resultRows = page.locator(".space-y-1\\.5 > div");
    this.copyButton = page.getByRole("button", { name: "Copy", exact: true });
    this.noResultsHint = page.locator("text=7 boundary values for complete test coverage");
  }

  async goto() {
    await this.page.goto("/en/tools/boundary-value-generator");
  }

  async setMin(value: string) {
    await fillRobust(this.minInput, value);
  }

  async setMax(value: string) {
    await fillRobust(this.maxInput, value);
  }

  dataTypeButton(type: "integer" | "float" | "string"): Locator {
    const label = type === "string" ? "String (length)" : type;
    return this.page.getByRole("button", { name: label, exact: true });
  }
}
