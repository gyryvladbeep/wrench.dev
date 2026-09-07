import { test, expect } from "@playwright/test";
import { ChmodCalculatorPage } from "./pages/ChmodCalculatorPage";

test.describe("Chmod Calculator", () => {
  let tool: ChmodCalculatorPage;

  test.beforeEach(async ({ page }) => {
    tool = new ChmodCalculatorPage(page);
    await tool.goto();
  });

  test("по умолчанию 644 — owner rw, group r, others r", async () => {
    await expect(tool.octalValue).toHaveText("644");
    await expect(tool.symbolicValue).toHaveText("-rw-r--r--");
    await expect(tool.chmodCommand).toHaveText("chmod 644 filename");

    await expect(tool.checkbox("Owner (u)", "Read")).toBeChecked();
    await expect(tool.checkbox("Owner (u)", "Write")).toBeChecked();
    await expect(tool.checkbox("Owner (u)", "Execute")).not.toBeChecked();
  });

  test("пресет 755 — scripts/dirs выставляет owner rwx, group/others r-x", async () => {
    await tool.clickPreset("755 — scripts/dirs");

    await expect(tool.octalValue).toHaveText("755");
    await expect(tool.symbolicValue).toHaveText("-rwxr-xr-x");
    await expect(tool.checkbox("Owner (u)", "Execute")).toBeChecked();
    await expect(tool.checkbox("Group (g)", "Write")).not.toBeChecked();
  });

  test("ручное включение Execute у Owner меняет октальное и символьное представление", async () => {
    // По умолчанию owner = 6 (rw-). Включаем Execute → 7 (rwx).
    await tool.checkbox("Owner (u)", "Execute").check();

    await expect(tool.octalValue).toHaveText("744");
    await expect(tool.symbolicValue).toHaveText("-rwxr--r--");
  });

  test("пресет 777 — everyone (risky) даёт все права всем", async () => {
    await tool.clickPreset("777 — everyone (risky)");

    await expect(tool.octalValue).toHaveText("777");
    await expect(tool.symbolicValue).toHaveText("-rwxrwxrwx");
  });

  test("снятие всех галочек во всех строках даёт 000 и '---------'", async () => {
    for (const row of ["Owner (u)", "Group (g)", "Others (o)"] as const) {
      for (const perm of ["Read", "Write", "Execute"] as const) {
        const cb = tool.checkbox(row, perm);
        if (await cb.isChecked()) await cb.uncheck();
      }
    }

    await expect(tool.octalValue).toHaveText("000");
    await expect(tool.symbolicValue).toHaveText("----------"); // "-" (тип файла) + 9 дефисов прав
    await expect(tool.chmodCommand).toHaveText("chmod 000 filename");
  });
});
