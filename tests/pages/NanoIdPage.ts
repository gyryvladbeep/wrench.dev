import { Page, Locator, expect } from "@playwright/test";

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

  // ФИКС: NanoIdTool больше не заполняет textarea в первом же рендере —
  // начальный список ID теперь приходит из useEffect() на клиенте (см.
  // комментарий в GeneratorTools.tsx про hydration mismatch). Ждём
  // непустое значение перед чтением — та же ловушка и то же решение, что
  // и в UuidGeneratorPage.getGeneratedLines() / RandomColorPage.waitForColors().
  async outputLines(): Promise<string[]> {
    await expect(this.output).not.toHaveValue("");
    const value = await this.output.inputValue();
    return value.split("\n").filter((l) => l.length > 0);
  }
}
