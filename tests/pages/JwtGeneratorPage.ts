import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/jwt-generator (components/tools/JwtGeneratorTool.tsx). */
export class JwtGeneratorPage {
  readonly page: Page;
  readonly secretInput:   Locator;
  readonly payloadInput:  Locator;
  readonly generateButton: Locator;
  // Итоговый JWT собран из 3 <span> (header/payload/signature, разного цвета)
  // внутри этого контейнера — читаем его целиком, это и есть результат.
  readonly resultBlock: Locator;
  // div.text-red-400 (не span!) — сообщение об ошибке JSON.parse; тег важен,
  // т.к. у header-спана внутри JWT тоже класс text-red-400.
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.secretInput  = page.locator('input[type="password"]');
    this.payloadInput = page.locator("textarea");
    this.generateButton = page.getByRole("button", { name: /^(Generate JWT|Signing…)$/ });
    this.resultBlock = page.locator("div.break-all");
    this.errorMessage = page.locator("div.text-red-400");
  }

  async goto() {
    await this.page.goto("/en/tools/jwt-generator");
  }

  async selectAlg(alg: "HS256" | "HS384" | "HS512") {
    await this.page.getByRole("button", { name: alg, exact: true }).click();
  }

  async setSecret(value: string) {
    await this.secretInput.fill(value);
  }

  async setPayload(json: string) {
    await this.payloadInput.fill(json);
  }

  async generate() {
    await this.generateButton.click();
  }

  async resultText(): Promise<string> {
    return ((await this.resultBlock.textContent()) ?? "").trim();
  }
}
