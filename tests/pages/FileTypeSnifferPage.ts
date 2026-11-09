import { Page, Locator } from "@playwright/test";
import { waitForHydration } from "./hydration";

/** Page Object для /tools/file-type-sniffer (components/tools/FileTypeSnifferTool.tsx). */
export class FileTypeSnifferPage {
  readonly page: Page;
  readonly file: Locator;
  readonly empty: Locator;
  readonly result: Locator;
  readonly type: Locator;
  readonly hex: Locator;

  constructor(page: Page) {
    this.page = page;
    this.file = page.getByTestId("fz-file");
    this.empty = page.getByTestId("fz-empty");
    this.result = page.getByTestId("fz-result");
    this.type = page.getByTestId("fz-type");
    this.hex = page.getByTestId("fz-hex");
  }

  async goto() {
    await this.page.goto("/en/tools/file-type-sniffer");
    await waitForHydration(this.file);
  }

  async choose(name: string, mimeType: string, bytes: number[]) {
    await this.file.setInputFiles({ name, mimeType, buffer: Buffer.from(bytes) });
  }

  finding(code: string): Locator {
    return this.page.getByTestId("fz-findings").locator(`[data-code="${code}"]`).first();
  }
}
