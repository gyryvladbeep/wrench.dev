import { Page, Locator } from "@playwright/test";
import { waitForHydration } from "./hydration";
import { readFileSync } from "fs";

/** Page Object для /tools/test-image-generator (components/tools/TestImageGeneratorTool.tsx). */
export class TestImageGeneratorPage {
  readonly page: Page;
  readonly width: Locator;
  readonly height: Locator;
  readonly format: Locator;
  readonly info: Locator;
  readonly invalid: Locator;
  readonly downloadButton: Locator;
  readonly preview: Locator;

  constructor(page: Page) {
    this.page = page;
    this.width = page.getByLabel("Width, px", { exact: true });
    this.height = page.getByLabel("Height, px", { exact: true });
    this.format = page.getByLabel("Format", { exact: true });
    this.info = page.getByTestId("ti-info");
    this.invalid = page.getByTestId("ti-invalid");
    this.downloadButton = page.getByTestId("ti-download");
    this.preview = page.getByTestId("ti-preview");
  }

  async goto() {
    await this.page.goto("/en/tools/test-image-generator");
    await waitForHydration(this.width);
  }

  preset(label: string): Locator {
    return this.page.getByTestId(`ti-preset-${label}`);
  }

  async download(): Promise<{ name: string; data: Buffer }> {
    const [download] = await Promise.all([this.page.waitForEvent("download"), this.downloadButton.click()]);
    return { name: download.suggestedFilename(), data: readFileSync(await download.path()) };
  }
}
