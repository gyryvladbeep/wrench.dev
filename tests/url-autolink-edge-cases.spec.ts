import { test, expect } from "@playwright/test";
import { UrlAutolinkEdgeCasesPage } from "./pages/UrlAutolinkEdgeCasesPage";

test.describe("URL Autolink Edge Case Tester", () => {
  let tool: UrlAutolinkEdgeCasesPage;

  test.beforeEach(async ({ page }) => {
    tool = new UrlAutolinkEdgeCasesPage(page);
    await tool.goto();
  });

  test("образец про знаки препинания: найдено 3 ссылки, точки и скобки в конец не попали", async () => {
    await expect(tool.count).toContainText("3");
    await expect(tool.rows).toHaveCount(3);
    await expect(tool.rows.nth(0)).toContainText("https://example.com/path");
    await expect(tool.rows.nth(0)).not.toContainText("https://example.com/path,");
  });

  test("парные скобки Википедии остаются внутри ссылки", async () => {
    await tool.sample("parens").click();

    await expect(tool.rows).toHaveCount(1);
    await expect(tool.rows.first()).toContainText("Function_(mathematics)");
  });

  test("ссылка с логином помечается как userinfo", async () => {
    await tool.sample("phish").click();

    await expect(tool.rows.first()).toHaveAttribute("data-flags", /userinfo/);
  });

  test("интернациональные домены помечаются как punycode", async () => {
    await tool.sample("idn").click();

    await expect(tool.rows).toHaveCount(2);
    await expect(tool.rows.first()).toHaveAttribute("data-flags", /punycode/);
  });

  test("локальные адреса помечаются как private, port и insecure", async () => {
    await tool.sample("local").click();

    await expect(tool.rows).toHaveCount(3);
    await expect(tool.rows.first()).toHaveAttribute("data-flags", "private,port,insecure");
  });

  test("почта и www находятся без схемы", async () => {
    await tool.sample("mixed").click();

    await expect(tool.rows.nth(0)).toHaveAttribute("data-kind", "email");
    await expect(tool.rows.nth(1)).toHaveAttribute("data-kind", "www");
  });

  test("текст без ссылок даёт ноль результатов", async () => {
    await tool.text.fill("no links here");

    await expect(tool.count).toContainText("0");
    await expect(tool.rows).toHaveCount(0);
  });
});
