import { Page, Locator, expect } from "@playwright/test";

export class RegexTesterPage {
  readonly page: Page;

  readonly patternInput:    Locator;
  readonly testStringInput: Locator;
  readonly errorBox:        Locator;

  constructor(page: Page) {
    this.page = page;
    this.patternInput    = page.locator("#regex-pattern");
    this.testStringInput = page.locator("#regex-test-string");
    this.errorBox        = page.locator(".text-red-400, .text-error").first();
  }

  async goto() {
    await this.page.goto("/en/tools/regex-tester");
  }

  async setPattern(pattern: string) {
    await this.patternInput.fill(pattern);
  }

  async setTestString(str: string) {
    await this.testStringInput.fill(str);
  }

  // Возвращает чекбокс флага по его названию (i / g / m / s) —
  // это метод, который принимает ПАРАМЕТР, а не фиксированный локатор.
  // Полезно когда на странице несколько похожих элементов и нужно
  // выбрать конкретный по имени/номеру.
  flagCheckbox(flagLabel: RegExp | string): Locator {
    return this.page.getByLabel(flagLabel);
  }

  async expectMatchCount(count: number) {
    const expectedText = count === 1 ? "1 match" : `${count} matches`;
    await expect(this.page.getByText(expectedText, { exact: true })).toBeVisible();
  }
}