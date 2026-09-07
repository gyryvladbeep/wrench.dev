import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/json-validator (components/tools/JsonValidatorTool.tsx). */
export class JsonValidatorPage {
  readonly page: Page;
  readonly input: Locator;
  readonly loadValidButton:   Locator;
  readonly loadInvalidButton: Locator;
  readonly validHeading:   Locator;
  readonly invalidHeading: Locator;
  readonly emptyHint: Locator;
  // "— top-level value is a <summary>." — соседний span с validHeading.
  readonly summaryText: Locator;
  // Текст сообщения об ошибке под "✕ Invalid JSON".
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.input = page.locator("textarea");
    this.loadValidButton   = page.getByRole("button", { name: "Load valid example" });
    this.loadInvalidButton = page.getByRole("button", { name: "Load invalid example" });
    this.validHeading   = page.getByText("✓ Valid JSON", { exact: true });
    this.invalidHeading = page.getByText("✕ Invalid JSON", { exact: true });
    this.emptyHint = page.getByText("Paste some JSON above to validate it.", { exact: true });
    this.summaryText = this.validHeading.locator("xpath=following-sibling::span[1]");
    this.errorMessage = this.invalidHeading.locator("xpath=following-sibling::p[1]");
  }

  async goto() {
    await this.page.goto("/en/tools/json-validator");
  }

  async setInput(value: string) {
    await this.input.fill(value);
  }
}
