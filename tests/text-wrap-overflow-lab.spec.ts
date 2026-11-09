import { test, expect } from "@playwright/test";
import { TextWrapOverflowLabPage } from "./pages/TextWrapOverflowLabPage";

test.describe("text-wrap-overflow-lab", () => {
  let tool: TextWrapOverflowLabPage;

  test.beforeEach(async ({ page }) => {
    tool = new TextWrapOverflowLabPage(page);
    await tool.goto();
  });

  const LONG = "A".repeat(60);

  test("длинное слово без пробелов при ширине 200 вылезает только у normal", async () => {
    await tool.text.fill(LONG);
    await tool.width.fill("200");

    await expect(tool.variant("normal")).toHaveAttribute("data-overflow", "true");
    await expect(tool.variant("break-word")).toHaveAttribute("data-overflow", "false");
    await expect(tool.variant("anywhere")).toHaveAttribute("data-overflow", "false");
    await expect(tool.variant("break-all")).toHaveAttribute("data-overflow", "false");
  });

  test("в flex-режиме break-word перестаёт помогать, а anywhere и break-all работают", async () => {
    await tool.text.fill(LONG);
    await tool.width.fill("200");
    await tool.flex.check();

    await expect(tool.variant("break-word")).toHaveAttribute("data-overflow", "true");
    await expect(tool.variant("anywhere")).toHaveAttribute("data-overflow", "false");
    await expect(tool.variant("break-all")).toHaveAttribute("data-overflow", "false");
  });

  test("короткий текст при широком пузыре не вылезает ни в одном варианте", async () => {
    await tool.text.fill("hello");
    await tool.width.fill("400");

    for (const id of ["normal", "break-word", "anywhere", "break-all"] as const) {
      await expect(tool.variant(id)).toHaveAttribute("data-overflow", "false");
    }
  });

  test("все пять вариантов выведены", async () => {
    for (const id of ["normal", "break-word", "anywhere", "break-all", "hyphens-auto"] as const) {
      await expect(tool.variant(id)).toBeVisible();
    }
  });
});
