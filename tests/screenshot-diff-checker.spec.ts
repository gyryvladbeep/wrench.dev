import path from "path";
import { test, expect } from "@playwright/test";
import { ScreenshotDiffCheckerPage } from "./pages/ScreenshotDiffCheckerPage";

// Фикстуры сгенерированы заранее (см. tests/fixtures/screenshot-diff/): все 20×20,
// base/identical — сплошной синий; modified — тот же синий с закрашенным красным
// левым верхним квадратом 10×10 (100 из 400 пикселей = ровно 25% отличий);
// diff-size — 15×15 того же синего, для проверки предупреждения о несовпадении размеров.
const FIXTURES = path.join(__dirname, "fixtures/screenshot-diff");
const BASE = path.join(FIXTURES, "base.png");
const IDENTICAL = path.join(FIXTURES, "identical.png");
const MODIFIED = path.join(FIXTURES, "modified.png");
const DIFF_SIZE = path.join(FIXTURES, "diff-size.png");

test.describe("Screenshot Diff Checker", () => {
  let tool: ScreenshotDiffCheckerPage;

  test.beforeEach(async ({ page }) => {
    tool = new ScreenshotDiffCheckerPage(page);
    await tool.goto();
  });

  test("идентичные изображения дают 0.00% отличий", async () => {
    await tool.uploadA(BASE);
    await tool.uploadB(IDENTICAL);
    await tool.compare();

    await expect(tool.percentText()).toHaveText("0.00%");
    await expect(tool.pixelCountText()).toContainText("0 of 400 pixels");
    await expect(tool.diffImage).toBeVisible();
  });

  test("изменённый квадрат 10×10 из 20×20 даёт ровно 25% отличий", async () => {
    await tool.uploadA(BASE);
    await tool.uploadB(MODIFIED);
    await tool.compare();

    await expect(tool.percentText()).toHaveText("25.00%");
    await expect(tool.pixelCountText()).toContainText("100 of 400 pixels");
  });

  test("несовпадающие размеры изображений показывают предупреждение и считают лишнюю область как отличие", async () => {
    await tool.uploadA(BASE);
    await tool.uploadB(DIFF_SIZE);
    await tool.compare();

    await expect(tool.dimensionsWarning()).toBeVisible();
    // Холст 20×20 (по большему изображению): 15×15=225 пикселей совпадают,
    // оставшиеся 400-225=175 — это область за пределами 15×15, где B прозрачен.
    await expect(tool.percentText()).toHaveText("43.75%");
    await expect(tool.pixelCountText()).toContainText("175 of 400 pixels");
  });

  test("кнопка 'Compare' неактивна, пока не выбраны оба изображения", async () => {
    await expect(tool.compareButton).toBeDisabled();
    await tool.uploadA(BASE);
    await expect(tool.compareButton).toBeDisabled();
    await tool.uploadB(IDENTICAL);
    await expect(tool.compareButton).toBeEnabled();
  });

  test("ползунок чувствительности меняет подпись в реальном времени", async () => {
    await expect(tool.page.getByText("Sensitivity threshold: 10%")).toBeVisible();
    await tool.setThreshold(45);
    await expect(tool.page.getByText("Sensitivity threshold: 45%")).toBeVisible();
  });
});
