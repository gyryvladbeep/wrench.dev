import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/number-base-converter
 *  (components/tools/NumberBaseConverterTool.tsx). */
export class NumberBaseConverterPage {
  readonly page: Page;
  readonly input:  Locator;
  readonly fromBaseSelect: Locator;
  readonly errorMessage:   Locator;
  // Квадратики битового паттерна — рендерятся только когда decimal <= 0xFFFF.
  // Якорим ещё и по .font-mono — иначе локатор случайно ловит иконку
  // логотипа в шапке сайта (Header.tsx), у которой те же h-7 w-7, но нет
  // font-mono.
  readonly bitSquares: Locator;

  constructor(page: Page) {
    this.page = page;
    this.input = page.locator('input[placeholder="255"]');
    this.fromBaseSelect = page.locator("select");
    this.errorMessage = page.getByText("Invalid number for selected base");
    this.bitSquares = page.locator("span.h-7.w-7.font-mono");
  }

  async goto() {
    await this.page.goto("/en/tools/number-base-converter");
  }

  async setInput(value: string) {
    await this.input.fill(value);
  }

  async setFromBase(label: "Binary" | "Octal" | "Decimal" | "Hexadecimal") {
    await this.fromBaseSelect.selectOption({ label });
  }

  async clickPreset(n: number) {
    await this.page.getByRole("button", { name: String(n), exact: true }).click();
  }

  /** Значение конкретной строки конвертации по подписи "Base N" (уникальна на странице). */
  conversionValue(base: number): Locator {
    const row = this.page.getByText(`Base ${base}`, { exact: true }).locator("xpath=../..");
    return row.locator("span.flex-1");
  }
}
