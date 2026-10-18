import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/android-manifest-analyzer (components/tools/AndroidManifestAnalyzerTool.tsx). */
export class AndroidManifestAnalyzerPage {
  readonly page: Page;
  readonly input: Locator;
  readonly summary: Locator;
  readonly permissions: Locator;
  readonly components: Locator;
  readonly deepLinks: Locator;
  readonly error: Locator;

  constructor(page: Page) {
    this.page = page;
    this.input       = page.getByLabel("AndroidManifest.xml", { exact: true });
    this.summary     = page.getByTestId("manifest-summary");
    this.permissions = page.getByTestId("manifest-permissions");
    this.components  = page.getByTestId("manifest-components");
    this.deepLinks   = page.getByTestId("manifest-deeplinks");
    this.error       = page.getByTestId("manifest-error");
  }

  async goto() {
    await this.page.goto("/en/tools/android-manifest-analyzer");
  }

  async setManifest(xml: string) {
    await this.input.fill(xml);
  }

  /** Замечание по стабильному коду (data-code), например "debuggable" или "exported-missing". */
  finding(code: string): Locator {
    return this.page.getByTestId("manifest-findings").locator(`[data-code="${code}"]`);
  }

  permission(shortName: string): Locator {
    return this.permissions.locator("li", { hasText: shortName });
  }
}
