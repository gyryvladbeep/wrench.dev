import { test, expect } from "@playwright/test";
import { TextDiffPage } from "./pages/TextDiffPage";

type LineStatus = "added" | "removed" | "same";
interface DiffLine { text: string; status: LineStatus; }

// Точная копия lineDiff() (LCS-диф) из components/tools/TextDiffTool.tsx —
// воспроизводим алгоритм 1-в-1, чтобы не гадать, в каком порядке он решит
// расставить added/removed строки на неоднозначных участках.
function lineDiff(a: string, b: string): DiffLine[] {
  const linesA = a.split("\n");
  const linesB = b.split("\n");
  const m = linesA.length, n = linesB.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = linesA[i] === linesB[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);

  const result: DiffLine[] = [];
  let i = 0, j = 0;
  while (i < m || j < n) {
    if (i < m && j < n && linesA[i] === linesB[j]) {
      result.push({ text: linesA[i], status: "same" }); i++; j++;
    } else if (j < n && (i >= m || dp[i][j + 1] >= dp[i + 1][j])) {
      result.push({ text: linesB[j], status: "added" }); j++;
    } else {
      result.push({ text: linesA[i], status: "removed" }); i++;
    }
  }
  return result;
}

const STATUS_PREFIX: Record<LineStatus, string> = { added: "+ ", removed: "- ", same: "  " };

const DEFAULT_LEFT  = "The quick brown fox\njumps over the lazy dog\nHello world";
const DEFAULT_RIGHT = "The quick brown fox\nleaps over the lazy cat\nHello world\nNew line added";

test.describe("Text Diff", () => {
  let tool: TextDiffPage;

  test.beforeEach(async ({ page }) => {
    tool = new TextDiffPage(page);
    await tool.goto();
  });

  test("по умолчанию корректно считает added/removed и построчный дифф", async () => {
    const diff = lineDiff(DEFAULT_LEFT, DEFAULT_RIGHT);
    const added = diff.filter((l) => l.status === "added").length;
    const removed = diff.filter((l) => l.status === "removed").length;

    await expect(tool.addedSummary).toHaveText(`+${added} added`);
    await expect(tool.removedSummary).toHaveText(`-${removed} removed`);

    const rows = await tool.allRows();
    expect(rows).toHaveLength(diff.length);
    for (let k = 0; k < diff.length; k++) {
      expect(rows[k].prefix).toBe(STATUS_PREFIX[diff[k].status]);
      expect(rows[k].text).toBe(diff[k].text);
    }
  });

  test("идентичные тексты — 0 added, 0 removed, показан бейдж '✓ Identical'", async () => {
    await tool.setLeft("same text\nline two");
    await tool.setRight("same text\nline two");

    await expect(tool.addedSummary).toHaveText("+0 added");
    await expect(tool.removedSummary).toHaveText("-0 removed");
    await expect(tool.identicalBadge).toBeVisible();
  });

  test("добавленная в конец строка — только +1 added, бейдж Identical скрыт", async () => {
    await tool.setLeft("line one\nline two");
    await tool.setRight("line one\nline two\nline three");

    await expect(tool.addedSummary).toHaveText("+1 added");
    await expect(tool.removedSummary).toHaveText("-0 removed");
    await expect(tool.identicalBadge).toBeHidden();

    const rows = await tool.allRows();
    expect(rows[rows.length - 1]).toEqual({ prefix: "+ ", text: "line three" });
  });

  test("полностью разные однострочные тексты — 1 removed и 1 added", async () => {
    await tool.setLeft("original line");
    await tool.setRight("completely different line");

    const diff = lineDiff("original line", "completely different line");
    const added = diff.filter((l) => l.status === "added").length;
    const removed = diff.filter((l) => l.status === "removed").length;

    await expect(tool.addedSummary).toHaveText(`+${added} added`);
    await expect(tool.removedSummary).toHaveText(`-${removed} removed`);
  });
});
