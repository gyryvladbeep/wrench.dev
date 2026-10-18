import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/localization-strings-diff (components/tools/StringsDiffTool.tsx). */
export class StringsDiffPage {
  readonly page: Page;
  readonly source: Locator;
  readonly target: Locator;
  readonly format: Locator;
  readonly findings: Locator;

  constructor(page: Page) {
    this.page = page;
    this.source   = page.getByLabel("Source (for example, English)", { exact: true });
    this.target   = page.getByLabel("Translation", { exact: true });
    this.format   = page.getByTestId("strings-format");
    this.findings = page.getByTestId("strings-findings");
  }

  async goto() {
    await this.page.goto("/en/tools/localization-strings-diff");
  }

  async setFiles(source: string, target: string) {
    await this.source.fill(source);
    await this.target.fill(target);
  }

  finding(code: string): Locator {
    return this.findings.locator(`[data-code="${code}"]`);
  }

  /** Блок ключей: missing, placeholders, untranslated, empty, extra. */
  group(id: "missing" | "placeholders" | "untranslated" | "empty" | "extra"): Locator {
    return this.page.getByTestId(`strings-${id}`);
  }
}
