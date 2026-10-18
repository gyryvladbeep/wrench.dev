import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/android-ios-version-reference (components/tools/OsVersionReferenceTool.tsx). */
export class OsVersionReferencePage {
  readonly page: Page;
  readonly search: Locator;
  readonly empty: Locator;

  constructor(page: Page) {
    this.page = page;
    this.search = page.getByLabel("Search versions", { exact: true });
    this.empty = page.getByTestId("ver-empty");
  }

  async goto() {
    await this.page.goto("/en/tools/android-ios-version-reference");
  }

  async choosePlatform(platform: "Android" | "iOS") {
    await this.page.getByRole("button", { name: platform, exact: true }).click();
  }

  /** Карточка версии: platform = android | ios, version = "14", "12L", "27". */
  row(platform: "android" | "ios", version: string): Locator {
    return this.page.getByTestId(`ver-${platform}-${version}`);
  }
}
