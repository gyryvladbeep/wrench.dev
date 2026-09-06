import { test, expect } from "@playwright/test";
import { JsonMinifyPage } from "./pages/JsonMinifyPage";

// Точная копия SAMPLE и формулы компонента (components/tools/JsonMinifyTool.tsx),
// чтобы "ожидаемое" значение считалось так же, как считает сама страница —
// это избавляет от ручных ошибок при подсчёте длины строки и процента экономии.
const SAMPLE = `{
  "name": "Ada Lovelace",
  "born": 1815,
  "skills": [
    "mathematics",
    "programming"
  ]
}`;

function computeMinify(input: string): { ok: true; value: string; saved: number } | { ok: false } {
  if (!input.trim()) return { ok: true, value: "", saved: 0 };
  try {
    const minified = JSON.stringify(JSON.parse(input));
    const saved = Math.round((1 - minified.length / input.length) * 100);
    return { ok: true, value: minified, saved };
  } catch {
    return { ok: false };
  }
}

test.describe("JSON Minify", () => {
  let tool: JsonMinifyPage;

  test.beforeEach(async ({ page }) => {
    tool = new JsonMinifyPage(page);
    await tool.goto();
  });

  test("по умолчанию минифицирует пример JSON и показывает процент экономии", async () => {
    const expected = computeMinify(SAMPLE);
    if (!expected.ok) throw new Error("SAMPLE должен быть валидным JSON");

    await expect(tool.output).toHaveValue(expected.value);
    await expect(tool.savedBadge).toHaveText(`${expected.saved}% smaller`);
  });

  test("невалидный JSON показывает сообщение об ошибке вместо результата", async () => {
    await tool.setInput("{ broken json");
    await expect(tool.output).toHaveValue(/^Error: /);
    await expect(tool.savedBadge).toBeHidden();
  });

  test("пустой ввод даёт пустой результат без бейджа процента", async () => {
    await tool.setInput("   ");
    await expect(tool.output).toHaveValue("");
    await expect(tool.savedBadge).toBeHidden();
  });

  test("компактный JSON без лишних пробелов даёт результат идентичный вводу и 0% экономии", async () => {
    const compact = `{"a":1,"b":[1,2,3]}`;
    await tool.setInput(compact);
    const expected = computeMinify(compact);
    if (!expected.ok) throw new Error("compact должен быть валидным JSON");

    // Строка уже минимальна — результат совпадает 1-в-1 со входом, экономия 0%.
    await expect(tool.output).toHaveValue(expected.value);
    await expect(tool.output).toHaveValue(compact);
    await expect(tool.savedBadge).toHaveText("0% smaller");
  });
});
