import { test, expect } from "@playwright/test";
import { RandomColorPage } from "./pages/RandomColorPage";

// Точная копия hexToRgb/rgbToHsl из components/tools/GeneratorTools.tsx —
// проверяем, что показанные RGB/HSL действительно соответствуют HEX.
function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}
function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

test.describe("Random Color Generator", () => {
  let tool: RandomColorPage;

  test.beforeEach(async ({ page }) => {
    tool = new RandomColorPage(page);
    await tool.goto();
  });

  test("при загрузке показано 5 валидных HEX-цветов с согласованными RGB и HSL", async () => {
    await expect(tool.hexSpans).toHaveCount(5);
    await expect(tool.rgbSpans).toHaveCount(5);
    await expect(tool.hslSpans).toHaveCount(5);

    const hexes = await tool.allHex();
    for (let i = 0; i < 5; i++) {
      const hex = hexes[i];
      expect(hex).toMatch(/^#[0-9A-F]{6}$/);

      const { r, g, b } = hexToRgb(hex);
      const { h, s, l } = rgbToHsl(r, g, b);
      expect(await tool.rgbAt(i)).toBe(`${r},${g},${b}`);
      expect(await tool.hslAt(i)).toBe(`${h}°,${s}%,${l}%`);
    }
  });

  test("кнопка Generate меняет все 5 цветов, когда ни один не заблокирован", async () => {
    const before = await tool.allHex();
    await tool.generateButton.click();
    const after = await tool.allHex();

    for (let i = 0; i < 5; i++) {
      expect(after[i]).not.toBe(before[i]);
    }
  });

  test("заблокированный цвет не меняется при генерации, остальные — меняются", async () => {
    const before = await tool.allHex();
    await tool.lockButtonAt(0).click(); // блокируем первую строку

    await tool.generateButton.click();
    const after = await tool.allHex();

    expect(after[0]).toBe(before[0]); // заблокированная — без изменений
    expect(after[1]).not.toBe(before[1]);
  });
});
