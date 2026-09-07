import { Page, Locator } from "@playwright/test";
import { fillRobust } from "../support/robust-fill";

/** Page Object для /tools/rest-request-builder (components/tools/RestRequestBuilderTool.tsx).
 *  Как и ApiRequestBuilderTool — делает реальный fetch(), поэтому перехватываем
 *  запрос через page.route() для детерминированных тестов без внешней сети.
 */
export class RestRequestBuilderPage {
  readonly page: Page;
  readonly methodSelect: Locator;
  readonly urlInput: Locator;
  readonly sendButton: Locator;
  readonly errorText: Locator;
  readonly statusValue: Locator;
  readonly bodyTextarea: Locator;
  readonly responseBody: Locator;
  readonly copyResponseButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.methodSelect = page.locator("select");
    this.urlInput = page.getByPlaceholder("https://api.example.com/v1/resource");
    this.sendButton = page.getByRole("button", { name: /^(Send|Sending…)$/ });
    this.errorText = page.locator("p.text-red-400");
    this.statusValue = page.locator("span", { hasText: "Status:" }).locator("span.font-medium");
    this.bodyTextarea = page.locator("textarea:not([readonly])");
    this.responseBody = page.locator("textarea[readonly]");
    this.copyResponseButton = page.getByRole("button", { name: "Copy response" });
  }

  async goto() {
    await this.page.goto("/en/tools/rest-request-builder");
  }

  async setMethod(method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE") {
    await this.methodSelect.selectOption(method);
  }

  async setUrl(url: string) {
    await fillRobust(this.urlInput, url);
  }

  async mockJsonResponse(status: number, statusText: string, body: unknown, headers: Record<string, string> = {}) {
    await this.page.route("https://jsonplaceholder.typicode.com/**", async (route) => {
      await route.fulfill({ status, contentType: "application/json", headers, body: JSON.stringify(body) });
    });
  }

  async mockNetworkFailure() {
    await this.page.route("https://jsonplaceholder.typicode.com/**", (route) => route.abort("failed"));
  }
}
