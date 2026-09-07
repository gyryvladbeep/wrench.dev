import { Page, Locator } from "@playwright/test";
import { fillRobust } from "../support/robust-fill";

/** Page Object для /tools/json-to-typescript (components/tools/JsonToTypescriptTool.tsx). */
export class JsonToTypescriptPage {
  readonly page: Page;
  readonly input: Locator;
  readonly rootNameInput: Locator;
  readonly output: Locator;      // readonly textarea с TS-кодом
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.input = page.locator("textarea:not([readonly])");
    this.rootNameInput = page.getByPlaceholder("Root");
    this.output = page.locator("textarea[readonly]");
    this.errorMessage = page.locator("div.text-sm.text-red-400.font-mono");
  }

  async goto() {
    await this.page.goto("/en/tools/json-to-typescript");
  }

  async setInput(json: string) {
    await fillRobust(this.input, json);
  }

  async setRootName(name: string) {
    await fillRobust(this.rootNameInput, name);
  }
}
