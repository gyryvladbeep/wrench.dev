import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/jwt-decoder (components/tools/JwtDecoderTool.tsx). */
export class JwtDecoderPage {
  readonly page: Page;
  readonly tokenInput: Locator;
  readonly headerPre:  Locator;
  readonly payloadPre: Locator;
  // Текст ошибки (3-parts / decode) — единственный красный текст на странице.
  readonly errorMessage: Locator;
  readonly expiryNote: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tokenInput = page.locator("textarea");
    this.headerPre  = page.getByText("Header", { exact: true }).locator("xpath=../following-sibling::pre[1]");
    this.payloadPre = page.getByText("Payload", { exact: true }).locator("xpath=../following-sibling::pre[1]");
    this.errorMessage = page.locator("p.text-red-400");
    this.expiryNote = page.getByText(/^(Expired|Expires) /);
  }

  async goto() {
    await this.page.goto("/en/tools/jwt-decoder");
  }

  async setToken(value: string) {
    await this.tokenInput.fill(value);
  }
}
