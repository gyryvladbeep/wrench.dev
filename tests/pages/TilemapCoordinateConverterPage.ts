import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/tilemap-coordinate-converter (components/tools/TilemapCoordinateConverterTool.tsx). */
export class TilemapCoordinateConverterPage {
  readonly page: Page;
  readonly tileWidthInput: Locator;
  readonly tileHeightInput: Locator;
  readonly colInput: Locator;
  readonly rowInput: Locator;
  readonly screenXInput: Locator;
  readonly screenYInput: Locator;
  readonly gridToScreenResult: Locator;
  readonly screenToGridResult: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tileWidthInput  = this.byLabel("Tile width");
    this.tileHeightInput = this.byLabel("Tile height");
    this.colInput     = this.byLabel("Column");
    this.rowInput     = this.byLabel("Row");
    this.screenXInput = this.byLabel("Screen X");
    this.screenYInput = this.byLabel("Screen Y");
    // "x: N, y: N" (Grid → Screen) и "col: N, row: N" (Screen → Grid) — разные
    // текстовые шаблоны, не пересекаются.
    this.gridToScreenResult = page.getByText(/^x: .+, y: .+$/);
    this.screenToGridResult = page.getByText(/^col: .+, row: .+$/);
  }

  private byLabel(label: string): Locator {
    return this.page.getByText(label, { exact: true }).locator("xpath=following-sibling::input[1]");
  }

  async goto() {
    await this.page.goto("/en/tools/tilemap-coordinate-converter");
  }

  async setMode(mode: "Orthogonal" | "Isometric") {
    await this.page.getByRole("button", { name: mode, exact: true }).click();
  }

  async setTileSize(width: number, height: number) {
    await this.tileWidthInput.fill(String(width));
    await this.tileHeightInput.fill(String(height));
  }

  async setGrid(col: number, row: number) {
    await this.colInput.fill(String(col));
    await this.rowInput.fill(String(row));
  }

  async setScreen(x: number, y: number) {
    await this.screenXInput.fill(String(x));
    await this.screenYInput.fill(String(y));
  }
}
