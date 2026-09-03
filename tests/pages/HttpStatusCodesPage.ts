import { Page, Locator } from "@playwright/test";

export class HttpStatusCodesPage {
  readonly page: Page;

  readonly searchInput:  Locator;
  readonly resultsList:  Locator;
  readonly noResultsMsg: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput  = page.getByPlaceholder(/search by code or name/i);
    this.resultsList  = page.locator(".space-y-1 > div"); // карточки кодов
    this.noResultsMsg = page.getByText("No results found");
  }

  async goto() {
    await this.page.goto("/en/tools/http-status-codes");
  }

  async search(query: string) {
    await this.searchInput.fill(query);
  }

  // Фильтр по категории — метод принимает параметр, как мы уже
  // делали в RegexTesterPage.flagCheckbox()
  async filterByCategory(category: "all" | "1xx" | "2xx" | "3xx" | "4xx" | "5xx") {
    await this.page.getByRole("button", { name: category, exact: true }).click();
  }

  async getVisibleCount(): Promise<number> {
    return this.resultsList.count();
  }
}