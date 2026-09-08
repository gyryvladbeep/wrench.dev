import { test, expect } from "@playwright/test";
import { TilemapCoordinateConverterPage } from "./pages/TilemapCoordinateConverterPage";

test.describe("Tilemap Coordinate Converter", () => {
  let tool: TilemapCoordinateConverterPage;

  test.beforeEach(async ({ page }) => {
    tool = new TilemapCoordinateConverterPage(page);
    await tool.goto();
  });

  test("значения по умолчанию (изометрия, tile 64×32) считают Grid→Screen и Screen→Grid верно", async () => {
    // col=3,row=2 -> x=(3-2)*32=32, y=(3+2)*16=80
    await expect(tool.gridToScreenResult).toHaveText("x: 32, y: 80");
    // screenX=64,screenY=80 -> a=2, b=5 -> col=3.5, row=1.5
    await expect(tool.screenToGridResult).toHaveText("col: 3.5, row: 1.5");
  });

  test("переключение на Orthogonal пересчитывает оба направления по обычной формуле", async () => {
    await tool.setMode("Orthogonal");

    // col=3,row=2,tw=64,th=32 -> x=192, y=64
    await expect(tool.gridToScreenResult).toHaveText("x: 192, y: 64");
    // screenX=64,screenY=80 -> col=1, row=2.5
    await expect(tool.screenToGridResult).toHaveText("col: 1, row: 2.5");
  });

  test("свой размер тайла и координаты сетки пересчитывают Grid→Screen в изометрии", async () => {
    await tool.setTileSize(100, 50);
    await tool.setGrid(5, 1);

    // x=(5-1)*50=200, y=(5+1)*25=150
    await expect(tool.gridToScreenResult).toHaveText("x: 200, y: 150");
  });

  test("Screen→Grid пересчитывается при вводе своих экранных координат", async () => {
    await tool.setScreen(0, 32);

    // tw=64,th=32 (default), isometric: a=0/32=0, b=32/16=2 -> col=1, row=1
    await expect(tool.screenToGridResult).toHaveText("col: 1, row: 1");
  });
});
