import { test, expect } from "@playwright/test";
import { ContrastCheckerPage } from "./pages/ContrastCheckerPage";

// Точная копия формулы относительной яркости WCAG из
// components/tools/ContrastCheckerTool.tsx — считаем "ожидаемое" тем же
// способом, что и сама страница, чтобы не ошибиться вручную в математике.
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}
function srgbToLinear(c: number): number {
  const cs = c / 255;
  return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
}
function relativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map(srgbToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function expectedRatio(fg: string, bg: string): string {
  const l1 = relativeLuminance(hexToRgb(fg));
  const l2 = relativeLuminance(hexToRgb(bg));
  const hi = Math.max(l1, l2), lo = Math.min(l1, l2);
  return `${((hi + 0.05) / (lo + 0.05)).toFixed(2)}:1`;
}

test.describe("Contrast Checker", () => {
  let tool: ContrastCheckerPage;

  test.beforeEach(async ({ page }) => {
    tool = new ContrastCheckerPage(page);
    await tool.goto();
  });

  test("чёрный на белом даёт максимальный контраст 21:1 и проходит все 4 порога", async () => {
    await tool.setFg("#000000");
    await tool.setBg("#FFFFFF");

    await expect(tool.ratio).toHaveText(expectedRatio("#000000", "#FFFFFF"));
    for (const label of ["Normal text — AA", "Normal text — AAA", "Large text — AA", "Large text — AAA"]) {
      await expect(tool.statusFor(label)).toContainText("Pass");
    }
  });

  test("#767676 на белом (4.54:1) проходит AA для обычного текста, но не AAA", async () => {
    await tool.setFg("#767676");
    await tool.setBg("#FFFFFF");

    await expect(tool.ratio).toHaveText(expectedRatio("#767676", "#FFFFFF"));
    await expect(tool.statusFor("Normal text — AA")).toContainText("Pass");
    await expect(tool.statusFor("Normal text — AAA")).toContainText("Fail");
    await expect(tool.statusFor("Large text — AA")).toContainText("Pass");
    await expect(tool.statusFor("Large text — AAA")).toContainText("Pass");
  });

  test("светло-серый на белом (2.54:1) не проходит ни один порог WCAG", async () => {
    await tool.setFg("#9CA3AF");
    await tool.setBg("#FFFFFF");

    await expect(tool.ratio).toHaveText(expectedRatio("#9CA3AF", "#FFFFFF"));
    for (const label of ["Normal text — AA", "Normal text — AAA", "Large text — AA", "Large text — AAA"]) {
      await expect(tool.statusFor(label)).toContainText("Fail");
    }
  });

  test("кнопка swap меняет местами цвет текста и фона", async () => {
    await tool.setFg("#F59E0B");
    await tool.setBg("#18181B");

    await tool.swap();

    await expect(tool.fgInput).toHaveValue("#18181B");
    await expect(tool.bgInput).toHaveValue("#F59E0B");
  });

  test("клик по пресету 'Accent on dark' подставляет оба цвета и пересчитывает контраст", async () => {
    await tool.clickPreset("Accent on dark");

    await expect(tool.fgInput).toHaveValue("#F59E0B");
    await expect(tool.bgInput).toHaveValue("#18181B");
    await expect(tool.ratio).toHaveText(expectedRatio("#F59E0B", "#18181B"));
  });

  test("невалидный HEX скрывает превью и результаты, не ломая страницу", async () => {
    await tool.setFg("not-a-color");

    await expect(tool.ratio).toBeHidden();
  });
});
