import { Page, Locator } from "@playwright/test";
import { fillRobust } from "../support/robust-fill";

/** Page Object для /tools/json-schema-validator (components/tools/JsonSchemaValidatorTool.tsx). */
export class JsonSchemaValidatorPage {
  readonly page: Page;
  readonly json: Locator;
  readonly schema: Locator;
  readonly validMessage: Locator;
  readonly parseErrorHeading: Locator;
  readonly parseErrorText: Locator;
  readonly errorCountHeading: Locator;
  readonly errorRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.json = page.locator("textarea").nth(0);
    this.schema = page.locator("textarea").nth(1);
    this.validMessage = page.getByText("JSON is valid against the schema");
    this.parseErrorHeading = page.getByText("Parse error", { exact: true });
    this.parseErrorText = page.locator("p.mt-1.font-mono.text-xs.text-red-400");
    this.errorCountHeading = page.getByText(/^\d+ validation error\(s\)$/);
    this.errorRows = page.locator("div.flex.gap-3.text-xs");
  }

  async goto() {
    await this.page.goto("/en/tools/json-schema-validator");
  }

  async setJson(value: string) {
    await fillRobust(this.json, value);
  }

  async setSchema(value: string) {
    await fillRobust(this.schema, value);
  }
}
