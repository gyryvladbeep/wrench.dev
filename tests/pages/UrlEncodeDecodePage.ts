import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/url-encode-decode
 *  (components/tools/UrlEncodeDecodeTool.tsx). */
export class UrlEncodeDecodePage {
  readonly page: Page;
  readonly encodeButton: Locator;
  readonly decodeButton: Locator;
  readonly input:  Locator;
  readonly output: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.encodeButton = page.getByRole("button", { name: "Encode" });
    this.decodeButton = page.getByRole("button", { name: "Decode" });
    this.input  = page.locator("textarea").first();
    // Второе textarea рендерится только когда результат не пустой и не
    // ошибка — при ошибке текстовый блок с классом text-red-400, при
    // пустом вводе — плейсхолдер EmptyToolInput (см. компонент).
    this.output = page.locator("textarea").nth(1);
    this.errorMessage = page.locator(".text-red-400");
  }

  async goto() {
    await this.page.goto("/en/tools/url-encode-decode");
  }

  async setInput(value: string) {
    await this.input.fill(value);
  }
}
