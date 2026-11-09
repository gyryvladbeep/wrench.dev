import { Page, Locator, Download } from "@playwright/test";
import { waitForHydration } from "./hydration";
import { readFileSync } from "fs";

/** Page Object для /tools/test-file-generator (components/tools/TestFileGeneratorTool.tsx). */
export class TestFileGeneratorPage {
  readonly page: Page;
  readonly kind: Locator;
  readonly name: Locator;
  readonly size: Locator;
  readonly unit: Locator;
  readonly limit: Locator;
  readonly limitUnit: Locator;
  readonly bytes: Locator;
  readonly clamped: Locator;
  readonly downloadButton: Locator;
  readonly boundary: Locator;

  constructor(page: Page) {
    this.page = page;
    this.kind = page.getByLabel("File type", { exact: true });
    this.name = page.getByLabel("File name", { exact: true });
    this.size = page.getByLabel("Size", { exact: true });
    this.unit = page.getByLabel("Unit", { exact: true });
    this.limit = page.getByLabel("Attachment size limit", { exact: true });
    this.limitUnit = page.getByLabel("Limit unit", { exact: true });
    this.bytes = page.getByTestId("tf-bytes").locator("div").last();
    this.clamped = page.getByTestId("tf-clamped");
    this.downloadButton = page.getByTestId("tf-download");
    this.boundary = page.getByTestId("tf-boundary").locator("li");
  }

  async goto() {
    await this.page.goto("/en/tools/test-file-generator");
    await waitForHydration(this.size);
  }

  async setSize(size: string, unit: "B" | "KB" | "MB") {
    await this.size.fill(size);
    await this.unit.selectOption(unit);
  }

  /** Нажимает кнопку и возвращает скачанный файл: имя и содержимое. */
  async download(trigger: Locator): Promise<{ name: string; data: Buffer; raw: Download }> {
    const [download] = await Promise.all([this.page.waitForEvent("download"), trigger.click()]);
    const path = await download.path();
    return { name: download.suggestedFilename(), data: readFileSync(path), raw: download };
  }

  boundaryButton(index: 0 | 1 | 2): Locator {
    return this.page.getByTestId(`tf-boundary-${index}`);
  }

  namePreset(id: string): Locator {
    return this.page.getByTestId(`tf-name-${id}`);
  }
}
