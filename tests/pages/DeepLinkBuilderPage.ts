import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/deep-link-builder (components/tools/DeepLinkBuilderTool.tsx). */
export class DeepLinkBuilderPage {
  readonly page: Page;
  readonly url: Locator;
  readonly adb: Locator;
  readonly simctl: Locator;
  readonly manifest: Locator;
  readonly warnings: Locator;
  readonly schemeInput: Locator;
  readonly hostInput: Locator;
  readonly pathInput: Locator;
  readonly packageInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.url      = page.getByTestId("dl-url");
    this.adb      = page.getByTestId("dl-adb");
    this.simctl   = page.getByTestId("dl-simctl");
    this.manifest = page.getByTestId("dl-xml");
    this.warnings = page.getByTestId("dl-warnings");
    this.schemeInput  = page.getByLabel("Scheme", { exact: true });
    this.hostInput    = page.getByLabel("Host", { exact: true });
    this.pathInput    = page.getByLabel("Path", { exact: true });
    this.packageInput = page.getByLabel("Android package (optional, forces this app)", { exact: true });
  }

  async goto() {
    await this.page.goto("/en/tools/deep-link-builder");
  }

  async chooseKind(kind: "custom" | "https") {
    const name = kind === "custom" ? /Custom scheme/ : /Universal \/ App Link/;
    await this.page.getByRole("button", { name }).click();
  }

  paramKey(n: number): Locator {
    return this.page.getByLabel(`Key ${n}`, { exact: true });
  }

  paramValue(n: number): Locator {
    return this.page.getByLabel(`Value ${n}`, { exact: true });
  }

  async addParam() {
    await this.page.getByRole("button", { name: "Add parameter" }).click();
  }

  async removeParam(n: number) {
    await this.page.getByRole("button", { name: `Remove parameter ${n}` }).click();
  }
}
