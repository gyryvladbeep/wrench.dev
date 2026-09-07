import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/random-color-generator (components/tools/GeneratorTools.tsx,
 *  RandomColorTool). */
export class RandomColorPage {
  readonly page: Page;
  readonly generateButton: Locator;
  readonly copyAllButton:  Locator;
  readonly hexSpans: Locator;
  readonly rgbSpans: Locator;
  readonly hslSpans: Locator;

  constructor(page: Page) {
    this.page = page;
    this.generateButton = page.getByRole("button", { name: "Generate", exact: true });
    this.copyAllButton  = page.getByRole("button", { name: "Copy all HEX" });
    this.hexSpans = page.getByText(/^HEX: #[0-9A-F]{6}$/);
    this.rgbSpans = page.getByText(/^RGB: \d+,\d+,\d+$/);
    this.hslSpans = page.getByText(/^HSL: \d+°,\d+%,\d+%$/);
  }

  async goto() {
    await this.page.goto("/en/tools/random-color-generator");
  }

  async hexAt(i: number): Promise<string> {
    const text = await this.hexSpans.nth(i).textContent();
    return (text ?? "").replace("HEX: ", "");
  }

  async allHex(): Promise<string[]> {
    const texts = await this.hexSpans.allTextContents();
    return texts.map((t) => t.replace("HEX: ", ""));
  }

  async rgbAt(i: number): Promise<string> {
    return ((await this.rgbSpans.nth(i).textContent()) ?? "").replace("RGB: ", "");
  }

  async hslAt(i: number): Promise<string> {
    return ((await this.hslSpans.nth(i).textContent()) ?? "").replace("HSL: ", "");
  }

  /** Кнопка Lock/Unlock конкретной строки — первая <button> внутри строки
   *  (вторая — CopyButton), поэтому берём по позиции, а не по accessible name:
   *  у кнопки только title="Lock"/"Unlock", а видимый текст — emoji. */
  lockButtonAt(i: number): Locator {
    const row = this.hexSpans.nth(i).locator("xpath=ancestor::div[contains(@class,'rounded-[10px]')][1]");
    return row.locator("button").first();
  }
}
