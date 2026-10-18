import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/dp-px-converter (components/tools/DpPxConverterTool.tsx). */
export class DpPxConverterPage {
  readonly page: Page;
  readonly dpInput: Locator;
  readonly pxInput: Locator;
  readonly bucketSelect: Locator;
  readonly dpResult: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dpInput = page.getByLabel("Size in dp (Android) or pt (iOS)", { exact: true });
    this.pxInput = page.getByLabel("Pixels", { exact: true });
    this.bucketSelect = page.getByLabel("Density", { exact: true });
    this.dpResult = page.getByTestId("dp-result");
  }

  async goto() {
    await this.page.goto("/en/tools/dp-px-converter");
  }

  /** Ячейка таблицы с пикселями для корзины: ldpi, mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi, ios1x, ios2x, ios3x. */
  pixels(bucket: string): Locator {
    return this.page.getByTestId(`px-${bucket}`);
  }
}
