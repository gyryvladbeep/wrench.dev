import { Page, Locator } from "@playwright/test";
import { waitForHydration } from "./hydration";

/** Page Object для /tools/chat-scenario-matrix-generator (components/tools/ChatScenarioMatrixGeneratorTool.tsx). */
export class ChatScenarioMatrixGeneratorPage {
  readonly page: Page;
  readonly dims: Locator;
  readonly strategy: Locator;
  readonly csv: Locator;
  readonly errors: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dims = page.getByLabel("Dimensions: Name: value, value", { exact: true });
    this.strategy = page.getByLabel("Strategy", { exact: true });
    this.csv = page.getByTestId("sx-csv");
    this.errors = page.getByTestId("sx-errors");
  }

  async goto() {
    await this.page.goto("/en/tools/chat-scenario-matrix-generator");
    await waitForHydration(this.dims);
  }

  stat(id: string): Locator {
    return this.page.getByTestId(id).locator("div").last();
  }
}
