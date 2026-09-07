import { test, expect } from "@playwright/test";
import { ColorConverterPage } from "./pages/ColorConverterPage";

// Точная копия функций конвертации из components/tools/ColorConverterTool.tsx —
// считаем "ожидаемое" так же, как считает сама страница, чтобы не ошибиться
// вручную в математике HSL/HSV.
function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [Math.round(h * 60), Math.round(s * 100), Math.round(l * 100)];
}
function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const v = max, s = max === 0 ? 0 : d / max;
  let h = 0;
  if (d !== 0) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [Math.round(h * 60 + 360) % 360, Math.round(s * 100), Math.round(v * 100)];
}

function expectedFormats(hex: string) {
  const rgb = hexToRgb(hex)!;
  const hsl = rgbToHsl(...rgb);
  const hsv = rgbToHsv(...rgb);
  return {
    HEX:  hex.toUpperCase(),
    RGB:  `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`,
    RGBA: `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 1)`,
    HSL:  `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`,
    HSV:  `hsv(${hsv[0]}, ${hsv[1]}%, ${hsv[2]}%)`,
    "Tailwind approx": `text-[${hex.toUpperCase()}]`,
  };
}

test.describe("Color Converter", () => {
  let tool: ColorConverterPage;

  test.beforeEach(async ({ page }) => {
    tool = new ColorConverterPage(page);
    await tool.goto();
  });

  test("по умолчанию #F59E0B корректно конвертируется во все форматы", async () => {
    const expected = expectedFormats("#F59E0B");
    for (const [label, value] of Object.entries(expected)) {
      await expect(tool.formatValue(label)).toHaveText(value);
    }
  });

  test("невалидный HEX скрывает блок Formats и RGB-слайдеры", async () => {
    await tool.setHex("not-a-color");

    await expect(tool.formatsSection).toBeHidden();
    await expect(tool.rgbSlidersSection).toBeHidden();
  });

  test("3-значный HEX (#0F0) даёт корректный RGB, но HEX-формат показывает исходную короткую запись", async () => {
    await tool.setHex("#0F0");

    await expect(tool.formatValue("RGB")).toHaveText("rgb(0, 255, 0)");
    await expect(tool.formatValue("HEX")).toHaveText("#0F0");
  });

  test("клик по пресету Blue подставляет его HEX и пересчитывает форматы", async () => {
    await tool.clickPreset("Blue");

    const expected = expectedFormats("#3B82F6");
    await expect(tool.hexInput).toHaveValue("#3B82F6");
    await expect(tool.formatValue("RGB")).toHaveText(expected.RGB);
    await expect(tool.formatValue("HSL")).toHaveText(expected.HSL);
  });

  test("перетаскивание R-слайдера в 0 пересчитывает HEX и остальные форматы", async () => {
    await tool.rgbSlider("R").fill("0");

    const expected = expectedFormats("#009E0B");
    await expect(tool.hexInput).toHaveValue("#009E0B");
    await expect(tool.formatValue("RGB")).toHaveText(expected.RGB);
  });
});
