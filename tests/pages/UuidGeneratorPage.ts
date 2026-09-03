import { Page, Locator } from "@playwright/test";

export class UuidGeneratorPage {
  readonly page: Page;

  readonly countInput:      Locator;
  readonly uppercaseCheckbox: Locator;
  readonly hyphensCheckbox:   Locator;
  readonly generateButton:    Locator;
  readonly output:            Locator;

  constructor(page: Page) {
    this.page = page;
    this.countInput        = page.locator("#uuid-count");
    this.uppercaseCheckbox = page.getByLabel("Uppercase");
    this.hyphensCheckbox   = page.getByLabel("Hyphens");
    this.generateButton    = page.getByRole("button", { name: "Generate" });
    this.output            = page.locator("textarea");
  }

  async goto() {
    await this.page.goto("/en/tools/uuid-generator");
  }

  async setCount(count: number) {
    await this.countInput.fill(String(count));
  }

  async generate() {
    await this.generateButton.click();
  }

  // Метод возвращает уже РАЗОБРАННЫЙ результат (массив строк),
  // а не сырой текст — тестам так удобнее работать
  async getGeneratedLines(): Promise<string[]> {
    const value = await this.output.inputValue();
    return value.trim().split("\n").filter(Boolean);
  }
}