import { test, expect } from "@playwright/test";
import { SortLinesPage } from "./pages/SortLinesPage";

/** Тот же компаратор, что в компоненте (components/tools/TextTools.tsx,
 *  SortLinesTool) — эталон считаем ИДЕНТИЧНОЙ функцией сортировки, а не
 *  гадаем порядок вручную: localeCompare для смешанного регистра и
 *  UTF-символов может дать неочевидный на бумаге результат. */
function sortLines(input: string, mode: "az" | "za" | "length", caseSensitive: boolean): string {
  const lines = input.split("\n");
  const sorted = [...lines].sort((a, b) => {
    if (mode === "length") return a.length - b.length;
    const ca = caseSensitive ? a : a.toLowerCase();
    const cb = caseSensitive ? b : b.toLowerCase();
    return mode === "az" ? ca.localeCompare(cb) : cb.localeCompare(ca);
  });
  return sorted.join("\n");
}

const DEFAULT_INPUT = "banana\nApple\ncherry\napricot\nBerry";

test.describe("Sort Lines", () => {
  let tool: SortLinesPage;

  test.beforeEach(async ({ page }) => {
    tool = new SortLinesPage(page);
    await tool.goto();
  });

  test("по умолчанию A → Z без учёта регистра", async () => {
    await expect(tool.output).toHaveValue(sortLines(DEFAULT_INPUT, "az", false));
  });

  test("Z → A разворачивает порядок", async () => {
    await tool.zaButton.click();
    await expect(tool.output).toHaveValue(sortLines(DEFAULT_INPUT, "za", false));
  });

  test("By length сортирует по длине строки, а не по алфавиту", async () => {
    await tool.lengthButton.click();
    await expect(tool.output).toHaveValue(sortLines(DEFAULT_INPUT, "length", false));
  });

  test("Case sensitive меняет результат сортировки смешанного регистра", async () => {
    await tool.caseSensitiveCheckbox.check();
    await expect(tool.output).toHaveValue(sortLines(DEFAULT_INPUT, "az", true));
  });

  test("возврат на A → Z после By length снова сортирует по алфавиту", async () => {
    await tool.lengthButton.click();
    await tool.azButton.click();
    await expect(tool.output).toHaveValue(sortLines(DEFAULT_INPUT, "az", false));
  });
});
