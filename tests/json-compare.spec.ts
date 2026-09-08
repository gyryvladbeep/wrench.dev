import { test, expect } from "@playwright/test";
import { JsonComparePage } from "./pages/JsonComparePage";

// Точная копия flattenJson()/diffJson() из components/tools/JsonCompareTool.tsx.
type DiffEntry = { key: string; left: string; right: string; status: "added" | "removed" | "changed" | "same" };

function flattenJson(obj: unknown, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  if (obj === null || typeof obj !== "object") {
    result[prefix || "(root)"] = JSON.stringify(obj);
    return result;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => Object.assign(result, flattenJson(v, prefix ? `${prefix}[${i}]` : `[${i}]`)));
  } else {
    Object.entries(obj as Record<string, unknown>).forEach(([k, v]) => {
      const path = prefix ? `${prefix}.${k}` : k;
      if (v !== null && typeof v === "object") {
        Object.assign(result, flattenJson(v, path));
      } else {
        result[path] = JSON.stringify(v);
      }
    });
  }
  return result;
}

function diffJson(left: string, right: string): DiffEntry[] | null {
  try {
    const l = flattenJson(JSON.parse(left));
    const r = flattenJson(JSON.parse(right));
    const allKeys = Array.from(new Set([...Object.keys(l), ...Object.keys(r)])).sort();
    return allKeys.map((key) => ({
      key,
      left: l[key] ?? "",
      right: r[key] ?? "",
      status: !(key in l) ? "added" : !(key in r) ? "removed" : l[key] !== r[key] ? "changed" : "same",
    }));
  } catch { return null; }
}

const DEFAULT_LEFT  = '{"name":"Ada","age":30,"role":"engineer"}';
const DEFAULT_RIGHT = '{"name":"Ada","age":31,"city":"London","role":"engineer"}';

test.describe("JSON Compare", () => {
  let tool: JsonComparePage;

  test.beforeEach(async ({ page }) => {
    tool = new JsonComparePage(page);
    await tool.goto();
  });

  test("дефолтная пара — 2 отличия (age изменён, city добавлен), name/role без изменений", async () => {
    const diff = diffJson(DEFAULT_LEFT, DEFAULT_RIGHT)!;
    const changes = diff.filter((d) => d.status !== "same").length;
    expect(changes).toBe(2);

    await expect(tool.summary).toHaveText(`${changes} differences found`);
    await expect(tool.rowByKey("age")).toContainText("30");
    await expect(tool.rowByKey("age")).toContainText("31");
    await expect(tool.rowByKey("city")).toContainText("London");
    await expect(tool.rows).toHaveCount(diff.length);
  });

  test("идентичные JSON — 'Identical', 0 отличий", async () => {
    const same = '{"a":1,"b":2}';
    await tool.setLeft(same);
    await tool.setRight(same);

    await expect(tool.summary).toHaveText("Identical");
  });

  test("невалидный JSON в одном из полей — сообщение об ошибке вместо таблицы", async () => {
    await tool.setLeft("{not valid json");

    await expect(tool.invalidMessage).toBeVisible();
  });

  test("ключ, отсутствующий справа, помечается как 'removed'", async () => {
    await tool.setLeft('{"a":1,"onlyLeft":true}');
    await tool.setRight('{"a":1}');
    const diff = diffJson('{"a":1,"onlyLeft":true}', '{"a":1}')!;
    const changes = diff.filter((d) => d.status !== "same").length;

    await expect(tool.summary).toHaveText(`${changes} difference${changes === 1 ? "" : "s"} found`);
    await expect(tool.rowByKey("onlyLeft")).toContainText("true");
  });
});
