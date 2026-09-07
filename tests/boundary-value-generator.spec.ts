import { test, expect } from "@playwright/test";
import { BoundaryValuePage } from "./pages/BoundaryValuePage";

// Точная копия вычисления results из components/tools/BoundaryValueTool.tsx.
interface BVResult {
  value: number | string;
  label: string;
  isValid: boolean;
}

function computeResults(min: string, max: string, dataType: "integer" | "float" | "string"): BVResult[] {
  const mn = parseFloat(min);
  const mx = parseFloat(max);
  if (isNaN(mn) || isNaN(mx) || mn >= mx) return [];

  if (dataType === "string") {
    return [
      { value: 0, label: "Below min length", isValid: false },
      { value: mn, label: "Min length (valid)", isValid: true },
      { value: mn + 1, label: "Min+1 (valid)", isValid: true },
      { value: Math.floor((mn + mx) / 2), label: "Nominal", isValid: true },
      { value: mx - 1, label: "Max-1 (valid)", isValid: true },
      { value: mx, label: "Max length (valid)", isValid: true },
      { value: mx + 1, label: "Above max length", isValid: false },
    ];
  }

  const step = dataType === "float" ? 0.1 : 1;
  const nominal = parseFloat(((mn + mx) / 2).toFixed(1));

  return [
    { value: parseFloat((mn - step).toFixed(1)), label: "Below min", isValid: false },
    { value: mn, label: "Min (valid)", isValid: true },
    { value: parseFloat((mn + step).toFixed(1)), label: "Min+1", isValid: true },
    { value: nominal, label: "Nominal", isValid: true },
    { value: parseFloat((mx - step).toFixed(1)), label: "Max-1", isValid: true },
    { value: mx, label: "Max (valid)", isValid: true },
    { value: parseFloat((mx + step).toFixed(1)), label: "Above max", isValid: false },
  ];
}

function csvOf(results: BVResult[]): string {
  return results.map((r) => `${r.isValid ? "Valid" : "Invalid"},${r.value},${r.label}`).join("\n");
}

test.describe("Boundary Value Generator", () => {
  let tool: BoundaryValuePage;

  test.beforeEach(async ({ page }) => {
    tool = new BoundaryValuePage(page);
    await tool.goto();
  });

  test("по умолчанию min=1 max=100 integer — ровно 7 граничных значений по формуле", async () => {
    const expected = computeResults("1", "100", "integer");
    await expect(tool.resultRows).toHaveCount(7);

    const texts = await tool.resultRows.allTextContents();
    expected.forEach((r, i) => {
      expect(texts[i]).toContain(String(r.value));
      expect(texts[i]).toContain(r.isValid ? "OK" : "BAD");
    });
  });

  test("тип float с шагом 0.1 — граничные значения дают дробный шаг", async () => {
    await tool.dataTypeButton("float").click();
    await tool.setMin("0");
    await tool.setMax("1");

    const expected = computeResults("0", "1", "float");
    await expect(tool.resultRows).toHaveCount(7);
    const texts = await tool.resultRows.allTextContents();
    expected.forEach((r, i) => expect(texts[i]).toContain(String(r.value)));
    // Явно убеждаемся, что это дробные значения, а не целочисленный шаг.
    expect(expected.map((r) => r.value)).toEqual([-0.1, 0, 0.1, 0.5, 0.9, 1, 1.1]);
  });

  test("тип string (length) — фиксированные длины, а не числовой диапазон +-1", async () => {
    await tool.dataTypeButton("string").click();
    await tool.setMin("3");
    await tool.setMax("10");

    const expected = computeResults("3", "10", "string");
    await expect(tool.resultRows).toHaveCount(7);
    const texts = await tool.resultRows.allTextContents();
    expected.forEach((r, i) => expect(texts[i]).toContain(String(r.value)));
    expect(expected.map((r) => r.value)).toEqual([0, 3, 4, 6, 9, 10, 11]);
  });

  test("min >= max — граничные значения не показываются", async () => {
    await tool.setMin("50");
    await tool.setMax("50");
    await expect(tool.resultRows).toHaveCount(0);

    await tool.setMax("10");
    await expect(tool.resultRows).toHaveCount(0);
  });

  test("копирование даёт CSV в формате Valid/Invalid,значение,описание", async ({ context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await tool.copyButton.click();

    const expectedCsv = csvOf(computeResults("1", "100", "integer"));
    const clipboardText = await tool.page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(expectedCsv);
  });
});
