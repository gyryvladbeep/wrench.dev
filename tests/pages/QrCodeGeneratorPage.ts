import { Page, Locator } from "@playwright/test";
import { fillRobust } from "../support/robust-fill";

/** Page Object для /tools/qr-code-generator (components/tools/QrCodeGeneratorTool.tsx). */
export class QrCodeGeneratorPage {
  readonly page: Page;
  readonly input: Locator;
  readonly canvas: Locator;
  readonly sizeSlider: Locator;
  readonly pngButton: Locator;
  readonly svgButton: Locator;
  readonly errorText: Locator;

  constructor(page: Page) {
    this.page = page;
    this.input = page.getByPlaceholder("URL, text, email, phone…");
    this.canvas = page.locator("canvas");
    this.sizeSlider = page.locator('input[type="range"]');
    this.pngButton = page.getByRole("button", { name: "Download PNG" });
    this.svgButton = page.getByRole("button", { name: "Download SVG" });
    this.errorText = page.locator("p.text-red-400");
  }

  async goto() {
    await this.page.goto("/en/tools/qr-code-generator");
  }

  async setInput(text: string) {
    await fillRobust(this.input, text);
  }

  ecButton(level: "L" | "M" | "Q" | "H"): Locator {
    return this.page.getByRole("button", { name: level, exact: true });
  }

  /** dataURL текущего содержимого canvas — используем для сравнения "до/после". */
  async canvasDataUrl(): Promise<string> {
    return this.canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL());
  }

  async canvasSize(): Promise<{ width: number; height: number }> {
    return this.canvas.evaluate((el: HTMLCanvasElement) => ({ width: el.width, height: el.height }));
  }
}
