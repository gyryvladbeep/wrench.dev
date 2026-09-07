import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/color-converter (components/tools/ColorConverterTool.tsx). */
export class ColorConverterPage {
  readonly page: Page;
  readonly hexInput: Locator;
  // Блок "Formats" и RGB-слайдеры рендерятся только для валидного HEX.
  readonly formatsSection: Locator;
  readonly rgbSlidersSection: Locator;

  constructor(page: Page) {
    this.page = page;
    this.hexInput = page.locator('input[placeholder="#F59E0B"]');
    this.formatsSection = page.getByText("Formats", { exact: true });
    this.rgbSlidersSection = page.getByText("RGB sliders", { exact: true });
  }

  async goto() {
    await this.page.goto("/en/tools/color-converter");
  }

  async setHex(value: string) {
    await this.hexInput.fill(value);
  }

  async clickPreset(label: string) {
    await this.page.getByRole("button", { name: label }).click();
  }

  /** Значение строки формата по подписи ("HEX"/"RGB"/"RGBA"/"HSL"/"HSV"/"Tailwind approx"). */
  formatValue(label: string): Locator {
    return this.page.getByText(label, { exact: true }).locator("xpath=following-sibling::span[1]");
  }

  /** Range-слайдер конкретного канала ("R"/"G"/"B"). */
  rgbSlider(channel: "R" | "G" | "B"): Locator {
    return this.page.getByText(channel, { exact: true }).locator("xpath=following-sibling::input[1]");
  }
}
