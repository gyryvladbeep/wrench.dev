import { test, expect } from "@playwright/test";
import { PseudoLocalizationPage } from "./pages/PseudoLocalizationPage";

test.describe("Pseudo-Localization Generator", () => {
  let tool: PseudoLocalizationPage;

  test.beforeEach(async ({ page }) => {
    tool = new PseudoLocalizationPage(page);
    await tool.goto();
  });

  test("пример по умолчанию превращается в акцентированный текст со скобками и удлинением", async () => {
    await expect(tool.output).toContainText("[Šáṽé çĥáñĝéš ~~~]");
  });

  test("без удлинения строка только акцентируется и берётся в скобки", async () => {
    await tool.setExpansion(0);

    await expect(tool.output).toContainText("[Šáṽé çĥáñĝéš]");
    await expect(tool.output).toContainText("[Ŵéļçöɱé, %1$s!]");
  });

  test("подстановки и теги остаются нетронутыми и считаются в итоге", async () => {
    await tool.setText("Hi %s {n} <b>ok</b>");
    await tool.setExpansion(0);
    await tool.brackets.uncheck();

    await expect(tool.output).toHaveText("Ĥí %s {n} <b>öķ</b>");
    await expect(tool.summary).toHaveText("Strings: 1. Placeholders and tags kept untouched: 4.");
  });

  test("процент удлинения добавляет тильды: 100% на 4 буквах даёт три тильды", async () => {
    await tool.setText("abcd");
    await tool.brackets.uncheck();
    await tool.setExpansion(100);

    await expect(tool.output).toHaveText("áƀçð ~~~");
  });

  test("при выключенных акцентах, скобках и удлинении текст остаётся как был", async () => {
    await tool.setText("Plain text");
    await tool.accents.uncheck();
    await tool.brackets.uncheck();
    await tool.setExpansion(0);

    await expect(tool.output).toHaveText("Plain text");
  });

  test("пустые строки не получают скобок и удлинения, но сохраняются в списке", async () => {
    await tool.setText("One\n\nTwo");
    await tool.setExpansion(0);

    await expect(tool.summary).toContainText("Strings: 3.");
  });
});
