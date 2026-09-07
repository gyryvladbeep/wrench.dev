import { test, expect } from "@playwright/test";
import { JsonDiffPage } from "./pages/JsonDiffPage";

// Точная копия flattenObject()/diffJson() из components/tools/JsonDiffTool.tsx.
type DiffResult = { key: string; type: "added"|"removed"|"changed"|"unchanged"; left?: unknown; right?: unknown; }[];

function flattenObject(obj: unknown, prefix = ""): Record<string, unknown> {
  if (typeof obj !== "object" || obj === null) return { [prefix || "value"]: obj };
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      Object.assign(result, flattenObject(v, fullKey));
    } else {
      result[fullKey] = v;
    }
  }
  return result;
}

function diffJson(left: string, right: string): { ok: boolean; diffs: DiffResult; error?: string } {
  try {
    const l = flattenObject(JSON.parse(left));
    const r = flattenObject(JSON.parse(right));
    const allKeys = new Set([...Object.keys(l), ...Object.keys(r)]);
    const diffs: DiffResult = [];
    for (const key of allKeys) {
      const lv = l[key], rv = r[key];
      if (!(key in l)) diffs.push({ key, type:"added",   right:rv });
      else if (!(key in r)) diffs.push({ key, type:"removed", left:lv });
      else if (JSON.stringify(lv) !== JSON.stringify(rv)) diffs.push({ key, type:"changed", left:lv, right:rv });
      else diffs.push({ key, type:"unchanged", left:lv, right:rv });
    }
    return { ok:true, diffs };
  } catch (e) {
    return { ok:false, diffs:[], error: e instanceof Error ? e.message : "Parse error" };
  }
}

const LEFT  = `{
  "name": "Alice",
  "age": 28,
  "role": "QA Engineer",
  "active": true,
  "score": 95
}`;

const RIGHT = `{
  "name": "Alice",
  "age": 29,
  "role": "Senior QA",
  "active": true,
  "department": "Engineering"
}`;

test.describe("JSON Diff", () => {
  let tool: JsonDiffPage;

  test.beforeEach(async ({ page }) => {
    tool = new JsonDiffPage(page);
    await tool.goto();
  });

  test("дефолтная пара — +1 added, -1 removed, ~2 changed, =2 unchanged", async () => {
    const { diffs } = diffJson(LEFT, RIGHT);
    const stats = { added:0, removed:0, changed:0, unchanged:0 } as Record<string, number>;
    diffs.forEach((d) => stats[d.type]++);
    expect(stats).toEqual({ added:1, removed:1, changed:2, unchanged:2 });

    await expect(tool.statText("+1 added")).toBeVisible();
    await expect(tool.statText("−1 removed")).toBeVisible();
    await expect(tool.statText("~2 changed")).toBeVisible();
    await expect(tool.statText("=2 unchanged")).toBeVisible();
    // showUnchanged выключен по умолчанию — видно только 4 изменённые строки.
    await expect(tool.rows).toHaveCount(4);
  });

  test("галка 'Show unchanged' добавляет ещё 2 строки (name, active)", async () => {
    await tool.toggleShowUnchanged();
    await expect(tool.rows).toHaveCount(6);
  });

  test("идентичные JSON — '✓ JSONs are identical', 0 строк", async () => {
    const same = '{"x":1,"y":"z"}';
    await tool.setLeft(same);
    await tool.setRight(same);

    await expect(tool.identicalMessage).toBeVisible();
    await expect(tool.rows).toHaveCount(0);
  });

  test("невалидный JSON — показывается точный текст ошибки JSON.parse из браузера", async () => {
    const badJson = "{oops";
    const expectedMessage = await tool.page.evaluate((bad) => {
      try { JSON.parse(bad); return null; } catch (e) { return (e as Error).message; }
    }, badJson);

    await tool.setLeft(badJson);

    await expect(tool.errorBox).toHaveText(expectedMessage!);
  });

  test("удалённое поле помечается как 'removed', добавленное — как 'added'", async () => {
    await tool.setLeft('{"keep":1,"gone":true}');
    await tool.setRight('{"keep":1,"fresh":"new"}');

    await expect(tool.statText("+1 added")).toBeVisible();
    await expect(tool.statText("−1 removed")).toBeVisible();
  });
});
