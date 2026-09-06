import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/string-escape (components/tools/StringEscapeTool.tsx). */
export class StringEscapePage {
  readonly page: Page;
  readonly jsonModeButton:  Locator;
  readonly htmlModeButton:  Locator;
  readonly urlModeButton:   Locator;
  readonly regexModeButton: Locator;
  readonly sqlModeButton:   Locator;
  readonly csvModeButton:   Locator;
  readonly escapeButton:    Locator;
  readonly unescapeButton:  Locator;
  readonly input:  Locator;
  // Выходное textarea рендерится только когда output непустой — при
  // пустом выводе вместо него показывается плейсхолдер EmptyToolInput.
  readonly output: Locator;

  constructor(page: Page) {
    this.page = page;
    this.jsonModeButton  = page.getByRole("button", { name: "JSON", exact: true });
    this.htmlModeButton  = page.getByRole("button", { name: "HTML", exact: true });
    this.urlModeButton   = page.getByRole("button", { name: "URL", exact: true });
    this.regexModeButton = page.getByRole("button", { name: "Regex", exact: true });
    this.sqlModeButton   = page.getByRole("button", { name: "SQL", exact: true });
    this.csvModeButton   = page.getByRole("button", { name: "CSV", exact: true });
    this.escapeButton    = page.getByRole("button", { name: "Escape", exact: true });
    this.unescapeButton  = page.getByRole("button", { name: "Unescape", exact: true });
    this.input  = page.locator("textarea:not([readonly])");
    this.output = page.locator("textarea[readonly]");
  }

  async goto() {
    await this.page.goto("/en/tools/string-escape");
  }

  async setInput(value: string) {
    await this.input.fill(value);
  }
}
