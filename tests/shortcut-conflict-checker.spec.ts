import { test, expect } from "@playwright/test";
import { ShortcutConflictCheckerPage } from "./pages/ShortcutConflictCheckerPage";

test.describe("shortcut-conflict-checker", () => {
  let tool: ShortcutConflictCheckerPage;

  test.beforeEach(async ({ page }) => {
    tool = new ShortcutConflictCheckerPage(page);
    await tool.goto();
  });

  test("образец: 9 сочетаний и 9 замечаний", async () => {
    await expect(tool.stat("sk-count")).toHaveText("9");
    await expect(tool.stat("sk-issues")).toHaveText("9");
  });

  test("образец ловит все виды конфликтов", async () => {
    for (const code of ["reserved", "duplicate", "browser-common", "altgr", "plain-key", "mac-reserved"]) {
      await expect(tool.finding(code)).toBeVisible();
    }
  });

  test("повтор Ctrl+K в другом регистре считается дублем", async () => {
    await tool.input.fill("Ctrl+K: A\nctrl+k: B");

    await expect(tool.finding("duplicate")).toBeVisible();
  });

  test("свободные сочетания дают ok и 0 замечаний", async () => {
    await tool.input.fill("Ctrl+Shift+L: A\nCtrl+Shift+U: B");

    await expect(tool.stat("sk-count")).toHaveText("2");
    await expect(tool.stat("sk-issues")).toHaveText("0");
    await expect(tool.finding("ok")).toBeVisible();
  });
});
