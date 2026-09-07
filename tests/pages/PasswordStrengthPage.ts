import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/password-strength (components/tools/PasswordStrengthTool.tsx). */
export class PasswordStrengthPage {
  readonly page: Page;
  readonly passwordInput: Locator;
  readonly toggleShowButton: Locator;
  // Весь блок анализа рендерится только когда pwd непустой.
  readonly strengthLabel: Locator;
  readonly entropyText: Locator;
  readonly crackTimeValue: Locator;
  readonly suggestionsHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.passwordInput = page.getByPlaceholder("Enter password…");
    this.toggleShowButton = page.getByRole("button", { name: /^(Show|Hide)$/ });
    // "N bits entropy" — уникальный текст на странице; находим label-спан
    // как её предыдущего соседа, а не по классам .text-sm.font-medium —
    // те же классы есть у span с именем инструмента в блоке related tools
    // (ToolCard.tsx), что даёт неоднозначный локатор.
    this.entropyText = page.getByText(/bits entropy/);
    this.strengthLabel = this.entropyText.locator("xpath=preceding-sibling::span[1]");
    this.crackTimeValue = page.getByText("Brute-force crack time:").locator("xpath=following-sibling::span[1]");
    this.suggestionsHeading = page.getByText("Suggestions:", { exact: true });
  }

  async goto() {
    await this.page.goto("/en/tools/password-strength");
  }

  async setPassword(value: string) {
    await this.passwordInput.fill(value);
  }

  /** Иконка (✓/○) конкретного пункта проверки по его подписи. */
  checkIcon(label: string): Locator {
    return this.page.getByText(label, { exact: true }).locator("xpath=preceding-sibling::span[1]");
  }

  suggestionText(text: string): Locator {
    return this.page.getByText(`→ ${text}`, { exact: true });
  }
}
