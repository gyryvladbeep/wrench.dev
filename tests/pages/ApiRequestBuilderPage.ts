import { Page, Locator } from "@playwright/test";
import { fillRobust } from "../support/robust-fill";

/** Page Object для /tools/api-request-builder (components/tools/ApiRequestBuilderTool.tsx).
 *
 *  Инструмент делает реальный fetch() из браузера на введённый URL —
 *  чтобы тесты были детерминированы и не зависели от внешнего интернета
 *  (jsonplaceholder.typicode.com), перехватываем запрос через page.route().
 */
export class ApiRequestBuilderPage {
  readonly page: Page;
  readonly methodSelect: Locator;
  readonly urlInput: Locator;
  readonly sendButton: Locator;
  readonly errorText: Locator;
  readonly statusValue: Locator;
  readonly timeValue: Locator;
  readonly responseBody: Locator;
  readonly requestPreviewToggle: Locator;
  readonly requestPreview: Locator;

  constructor(page: Page) {
    this.page = page;
    this.methodSelect = page.locator("select").first();
    this.urlInput = page.getByPlaceholder("https://api.example.com/v1/users");
    this.sendButton = page.getByRole("button", { name: /^(Send|Sending…)$/ });
    this.errorText = page.locator("p.text-red-400");
    this.statusValue = page.locator("span", { hasText: "Status:" }).locator("span.font-medium");
    this.timeValue = page.getByText(/Time: \d+ms/);
    this.responseBody = page.locator("textarea[readonly]");
    this.requestPreviewToggle = page.locator("summary");
    this.requestPreview = page.locator("details pre");
  }

  async goto() {
    await this.page.goto("/en/tools/api-request-builder");
  }

  async setUrl(url: string) {
    await fillRobust(this.urlInput, url);
  }

  paramNameInput(index: number): Locator {
    return this.page.getByPlaceholder("Name").nth(index);
  }
  paramValueInput(index: number): Locator {
    return this.page.getByPlaceholder("Value").nth(index);
  }
  addParamButton(): Locator {
    return this.page.getByRole("button", { name: "+ Param" });
  }

  async mockJsonResponse(status: number, statusText: string, body: unknown, headers: Record<string, string> = {}) {
    await this.page.route("https://jsonplaceholder.typicode.com/**", async (route) => {
      await route.fulfill({
        status,
        contentType: "application/json",
        headers,
        body: JSON.stringify(body),
      });
    });
  }

  async mockNetworkFailure() {
    await this.page.route("https://jsonplaceholder.typicode.com/**", (route) => route.abort("failed"));
  }
}
