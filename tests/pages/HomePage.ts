import { Page, Locator, expect } from "@playwright/test";

/**
 * Page Object для главной страницы.
 * Смотри подробные объяснения паттерна в JsonFormatterPage.ts —
 * здесь тот же принцип, повторно объяснять не будем.
 */
export class HomePage {
  readonly page: Page;

  readonly heading:          Locator;
  readonly browseToolsLink:  Locator;
  readonly ruButton:         Locator;
  readonly enButton:         Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading         = page.locator("h1");
    this.browseToolsLink = page.getByRole("link", { name: "Browse tools" });
    this.ruButton        = page.getByRole("button", { name: "RU", exact: true });
    this.enButton        = page.getByRole("button", { name: "EN", exact: true });
  }

  async goto() {
    await this.page.goto("/en");
  }

  async clickBrowseTools() {
    await this.browseToolsLink.click();
    // waitForURL внутри метода Page Object — тест больше не должен
    // помнить про этот нюанс с ожиданием навигации, мы это уже
    // "отладили" один раз здесь, и это будет работать для всех тестов
    await this.page.waitForURL(/\/tools/, { timeout: 10_000 });
  }

  async switchToRussian() {
    await this.ruButton.click();
    await this.page.waitForURL(/\/ru/, { timeout: 10_000 });
  }

  async expectHeadingContains(text: string) {
    await expect(this.heading).toContainText(text);
  }
}