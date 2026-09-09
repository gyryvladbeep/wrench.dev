import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/curl-to-code-converter (components/tools/CurlToCodeConverterTool.tsx). */
export class CurlToCodeConverterPage {
  readonly page: Page;
  readonly curlInput: Locator;
  readonly codeOutput: Locator;
  readonly summaryBar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.curlInput = page.locator("textarea");
    this.codeOutput = page.locator("pre");
    this.summaryBar = page.locator("div.flex.items-center.gap-2.rounded-lg.border.border-border.bg-surface");
  }

  async goto() {
    await this.page.goto("/en/tools/curl-to-code-converter");
  }

  async setCurl(cmd: string) {
    await this.curlInput.fill(cmd);
  }

  async selectLang(label: "JavaScript (fetch)" | "Node.js (axios)" | "Python (requests)" | "PowerShell") {
    await this.page.getByRole("button", { name: label, exact: true }).click();
  }

  async codeText(): Promise<string> {
    return (await this.codeOutput.textContent()) ?? "";
  }
}
