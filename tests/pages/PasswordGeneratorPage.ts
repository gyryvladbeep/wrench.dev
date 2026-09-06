import { Page, Locator } from "@playwright/test";

export class PasswordGeneratorPage {
  readonly page: Page;

  readonly passwordDisplay: Locator;
  readonly lengthSlider:    Locator;
  readonly lowerCheckbox:   Locator;
  readonly upperCheckbox:   Locator;
  readonly digitsCheckbox:  Locator;
  readonly symbolsCheckbox: Locator;
  readonly generateButton:  Locator;

  constructor(page: Page) {
    this.page = page;
    this.passwordDisplay = page.locator("span.font-mono.text-lg");
    this.lengthSlider     = page.locator("#pw-length");
    // Лейблы — "a-z" / "A-Z" / "0-9" / "Symbols" (dict.tools.password),
    // каждый оборачивает свой чекбокс, так что getByLabel их находит.
    this.lowerCheckbox   = page.getByLabel("a-z", { exact: true });
    this.upperCheckbox   = page.getByLabel("A-Z", { exact: true });
    this.digitsCheckbox  = page.getByLabel("0-9", { exact: true });
    this.symbolsCheckbox = page.getByLabel("Symbols", { exact: true });
    this.generateButton  = page.getByRole("button", { name: "Generate" });
  }

  async goto() {
    await this.page.goto("/en/tools/random-password-generator");
  }

  async getPassword(): Promise<string> {
    return (await this.passwordDisplay.textContent())?.trim() ?? "";
  }

  async setLength(value: number) {
    // Range-инпуты не поддерживают обычный ввод текста — двигаем через
    // клавиатуру, это надёжнее, чем руками выставлять DOM-value.
    await this.lengthSlider.focus();
    const current = Number(await this.lengthSlider.inputValue());
    const steps = value - current;
    const key = steps > 0 ? "ArrowRight" : "ArrowLeft";
    for (let i = 0; i < Math.abs(steps); i++) {
      await this.page.keyboard.press(key);
    }
  }
}
