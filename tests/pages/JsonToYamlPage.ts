import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/json-to-yaml (components/tools/JsonToYamlTool.tsx). */
export class JsonToYamlPage {
  readonly page: Page;
  readonly jsonToYamlButton: Locator;
  readonly yamlToJsonButton: Locator;
  readonly swapButton: Locator;
  readonly input:  Locator;
  readonly output: Locator;

  constructor(page: Page) {
    this.page = page;
    this.jsonToYamlButton = page.getByRole("button", { name: "JSON → YAML" });
    this.yamlToJsonButton = page.getByRole("button", { name: "YAML → JSON" });
    this.swapButton = page.getByRole("button", { name: "⇄ Swap" });
    this.input  = page.locator("textarea").first();
    this.output = page.locator("textarea").nth(1);
  }

  async goto() {
    await this.page.goto("/en/tools/json-to-yaml");
  }

  async setInput(value: string) {
    await this.input.fill(value);
  }
}
