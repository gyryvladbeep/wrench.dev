import { test, expect } from "@playwright/test";
import { JsonSortPage } from "./pages/JsonSortPage";

const DEFAULT_INPUT = '{"zebra":1,"apple":{"mango":2,"banana":3},"cherry":[5,2,1]}';

// Точная копия sortKeys() из components/tools/JsonSortTool.tsx: рекурсивно
// сортирует ключи объектов по алфавиту, элементы массивов не переупорядочивает
// (только рекурсивно сортирует ключи внутри объектов-элементов).
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value as object).sort().map((k) => [k, sortKeys((value as Record<string, unknown>)[k])])
    );
  }
  return value;
}

function computeSort(input: string, indent: 2 | 4): string {
  return JSON.stringify(sortKeys(JSON.parse(input)), null, indent);
}

test.describe("JSON Key Sorter", () => {
  let tool: JsonSortPage;

  test.beforeEach(async ({ page }) => {
    tool = new JsonSortPage(page);
    await tool.goto();
  });

  test("по умолчанию ключи отсортированы по алфавиту с отступом 2", async () => {
    await expect(tool.output).toHaveValue(computeSort(DEFAULT_INPUT, 2));
  });

  test("переключение на отступ 4 меняет форматирование результата", async () => {
    await tool.indent4Button.click();
    await expect(tool.output).toHaveValue(computeSort(DEFAULT_INPUT, 4));
  });

  test("вложенные объекты сортируются рекурсивно, порядок элементов массива не меняется", async () => {
    const nested = '{"z":{"y":2,"x":1},"a":[{"z":1,"a":2}],"m":3}';
    await tool.setInput(nested);
    const expected = computeSort(nested, 2);

    await expect(tool.output).toHaveValue(expected);
    // Убедимся явно, что массив [{"z":1,"a":2}] НЕ отсортирован как массив —
    // единственный элемент остался на месте, но его ключи пересортированы.
    expect(expected).toContain('"a": [\n    {\n      "a": 2,\n      "z": 1\n    }\n  ]');
  });

  test("невалидный JSON показывает сообщение об ошибке вместо результата", async () => {
    await tool.setInput("{not valid");
    await expect(tool.output).toHaveValue(/^Error: /);
  });

  test("пустой ввод даёт пустой результат", async () => {
    await tool.setInput("");
    await expect(tool.output).toHaveValue("");
  });
});
