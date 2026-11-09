import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/unicode-text-inspector (components/tools/UnicodeTextInspectorTool.tsx). */
export class UnicodeTextInspectorPage {
  readonly page: Page;
  readonly text: Locator;
  readonly limit: Locator;
  readonly findings: Locator;
  readonly rows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.text = page.getByLabel("Message text", { exact: true });
    this.limit = page.getByLabel("Message limit", { exact: true });
    this.findings = page.getByTestId("ui-findings");
    this.rows = page.getByTestId("ui-rows").locator("tbody tr");
  }

  async goto() {
    await this.page.goto("/en/tools/unicode-text-inspector");
  }

  stat(name: "graphemes" | "codepoints" | "utf16" | "utf8" | "lines"): Locator {
    return this.page.getByTestId(`ui-${name}`).locator("div").last();
  }

  finding(code: string): Locator {
    return this.findings.locator(`[data-code="${code}"]`);
  }

  limitRow(unit: "utf16" | "codePoints" | "graphemes" | "utf8"): Locator {
    return this.page.getByTestId("ui-limits").locator(`[data-unit="${unit}"]`);
  }
}
