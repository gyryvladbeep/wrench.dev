import { Page, Locator } from "@playwright/test";
import { fillRobust } from "../support/robust-fill";

/** Page Object для /tools/curl-generator (components/tools/CurlGeneratorTool.tsx). */
export class CurlGeneratorPage {
  readonly page: Page;
  readonly methodSelect: Locator;
  readonly urlInput: Locator;
  readonly addHeaderButton: Locator;
  readonly bodyTextarea: Locator;
  readonly command: Locator;
  readonly copyButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.methodSelect = page.locator("select");
    this.urlInput = page.getByPlaceholder("https://api.example.com/v1/resource");
    this.addHeaderButton = page.getByRole("button", { name: "+ Add header" });
    this.bodyTextarea = page.locator("#curl-body");
    this.command = page.locator("pre");
    this.copyButton = page.getByRole("button", { name: "Copy", exact: true });
  }

  async goto() {
    await this.page.goto("/en/tools/curl-generator");
  }

  async setMethod(method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE") {
    await this.methodSelect.selectOption(method);
  }

  async setUrl(url: string) {
    await fillRobust(this.urlInput, url);
  }

  headerNameInput(index: number): Locator {
    return this.page.getByPlaceholder("Header-Name").nth(index);
  }

  headerValueInput(index: number): Locator {
    return this.page.getByPlaceholder("value").nth(index);
  }

  removeHeaderButton(index: number): Locator {
    return this.page.getByRole("button", { name: "Remove header" }).nth(index);
  }

  async setBody(body: string) {
    await fillRobust(this.bodyTextarea, body);
  }
}
