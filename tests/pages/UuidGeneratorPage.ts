import { Page, Locator, expect } from "@playwright/test";

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
  //
  // ФИКС: UuidGeneratorTool больше не заполняет textarea в первом же
  // рендере — начальный список UUID теперь приходит из useEffect() на
  // клиенте (см. её комментарий в UuidGeneratorTool.tsx про hydration
  // mismatch). inputValue() — одноразовое чтение без ожидания; вызванное
  // сразу после goto(), до того как эффект успел отработать, оно вернёт
  // пустую строку. expect(...).not.toHaveValue("") ждёт и повторяет
  // попытку, пока значение не появится, — тот же приём, что и в
  // currentCardOrder() (WorkbenchPage.ts) и waitForColors() (RandomColorPage.ts).
  async getGeneratedLines(): Promise<string[]> {
    await expect(this.output).not.toHaveValue("");
    const value = await this.output.inputValue();
    return value.trim().split("\n").filter(Boolean);
  }
}