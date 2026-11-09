import { test, expect } from "@playwright/test";
import { MessageFormattingCorpusPage } from "./pages/MessageFormattingCorpusPage";

test.describe("Message Formatting Test Corpus", () => {
  let tool: MessageFormattingCorpusPage;

  test.beforeEach(async ({ page }) => {
    tool = new MessageFormattingCorpusPage(page);
    await tool.goto();
  });

  test("по умолчанию открыта группа форматирования: 12 случаев из 42", async () => {
    await expect(tool.count).toHaveText("12 / 42");
    await expect(tool.cases).toHaveCount(12);
    await expect(tool.tab("markdown")).toHaveAttribute("aria-selected", "true");
  });

  test("вкладка «Инъекции» показывает 9 случаев, среди них безвредный script-маркер", async () => {
    await tool.tab("injection").click();

    await expect(tool.count).toHaveText("9 / 42");
    await expect(tool.caseItem("inj-script")).toContainText("window.__xss=1");
  });

  test("поиск сужает набор внутри группы", async () => {
    await tool.tab("injection").click();
    await tool.search.fill("iframe");

    await expect(tool.cases).toHaveCount(1);
    await expect(tool.caseItem("inj-iframe")).toBeVisible();
  });

  test("поиск без совпадений даёт пустой список", async () => {
    await tool.search.fill("zzzz-no-such-case");

    await expect(tool.cases).toHaveCount(0);
    await expect(tool.count).toHaveText("0 / 42");
  });

  test("у каждой группы есть случаи: 12, 9, 7, 9 и 5", async () => {
    const expected: Record<string, number> = { markdown: 12, links: 9, mentions: 7, injection: 9, layout: 5 };
    for (const [id, n] of Object.entries(expected)) {
      await tool.tab(id as "markdown").click();
      await expect(tool.cases).toHaveCount(n);
    }
  });
});
