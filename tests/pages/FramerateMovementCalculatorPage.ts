import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/framerate-independent-movement-calculator
 *  (components/tools/FramerateIndependentMovementCalculatorTool.tsx). */
export class FramerateMovementCalculatorPage {
  readonly page: Page;
  readonly speedValueInput: Locator;
  readonly speedFpsInput: Locator;
  readonly halfLifeInput: Locator;
  readonly perSecondResult: Locator;
  readonly speedTable: Locator;
  readonly lerpTable: Locator;

  constructor(page: Page) {
    this.page = page;
    this.speedValueInput = this.byLabel("Speed (per frame)");
    this.speedFpsInput   = this.byLabel("Tuned at FPS");
    this.halfLifeInput   = this.byLabel("Half-life, seconds (time to close half the distance)");
    // "120.00 /sec" — единственное место на странице с таким шаблоном.
    this.perSecondResult = page.getByText(/^\d+\.\d{2} \/sec$/);
    // Первая таблица — конвертер скорости, вторая — коэффициент сглаживания.
    this.speedTable = page.locator("table").nth(0);
    this.lerpTable  = page.locator("table").nth(1);
  }

  private byLabel(label: string): Locator {
    return this.page.getByText(label, { exact: true }).locator("xpath=following-sibling::input[1]");
  }

  async goto() {
    await this.page.goto("/en/tools/framerate-independent-movement-calculator");
  }

  async setSpeed(value: number, fps: number) {
    await this.speedValueInput.fill(String(value));
    await this.speedFpsInput.fill(String(fps));
  }

  async setHalfLife(seconds: number) {
    await this.halfLifeInput.fill(String(seconds));
  }

  /** Ячейка "per-frame speed" для строки с данным FPS в таблице скорости. */
  perFrameSpeed(fps: number): Locator {
    return this.speedTable.locator("tr", { hasText: String(fps) }).locator("td").nth(1);
  }

  /** Ячейка "per-frame factor" для строки с данным FPS в таблице сглаживания. */
  lerpFactor(fps: number): Locator {
    return this.lerpTable.locator("tr", { hasText: String(fps) }).locator("td").nth(2);
  }
}
