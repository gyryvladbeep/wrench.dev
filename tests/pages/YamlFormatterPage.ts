import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/yaml-formatter (components/tools/YamlFormatterTool.tsx). */
export class YamlFormatterPage {
  readonly page: Page;
  readonly formatModeButton: Locator;
  readonly jsonModeButton:   Locator;
  readonly input:  Locator;
  // Выходное textarea рендерится только когда результат валиден и непустой —
  // при ошибке вместо него div.text-red-400, при пустом вводе — EmptyToolInput.
  readonly output: Locator;
  readonly errorBlock: Locator;
  readonly statsText: Locator; // "N lines · M keys"

  constructor(page: Page) {
    this.page = page;
    this.formatModeButton = page.getByRole("button", { name: "Format", exact: true });
    this.jsonModeButton   = page.getByRole("button", { name: "To JSON", exact: true });
    this.input  = page.locator("textarea:not([readonly])");
    this.output = page.locator("textarea[readonly]");
    this.errorBlock = page.locator("div.text-red-400");
    this.statsText = page.getByText(/^\d+ lines · \d+ keys$/);
  }

  async goto() {
    await this.page.goto("/en/tools/yaml-formatter");
  }

  async setInput(value: string) {
    await this.input.fill(value);
  }
}
