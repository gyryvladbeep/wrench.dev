import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/nanoid-generator (components/tools/GeneratorTools.tsx,
 *  NanoIdTool). */
export class NanoIdPage {
  readonly page: Page;
  readonly sizeInput:     Locator;
  readonly countInput:    Locator;
  readonly alphabetInput: Locator;
  readonly generateButton: Locator;
  readonly output: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sizeInput  = page.locator('input[type="number"]').first();
    this.countInput = page.locator('input[type="number"]').nth(1);
    this.alphabetInput = page.locator('input:not([type="number"])');
    this.generateButton = page.getByRole("button", { name: "Generate", exact: true });
    this.output = page.locator("textarea");
  }

  async goto() {
    await this.page.goto("/en/tools/nanoid-generator");
  }

  async setSize(n: number) {
    await this.sizeInput.fill(String(n));
  }

  async setCount(n: number) {
    await this.countInput.fill(String(n));
  }

  async setAlphabet(alphabet: string) {
    await this.alphabetInput.fill(alphabet);
  }

  async outputLines(): Promise<string[]> {
    const value = await this.output.inputValue();
    return value.split("\n").filter((l) => l.length > 0);
  }
}
