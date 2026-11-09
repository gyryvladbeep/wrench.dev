import { test, expect } from "@playwright/test";
import { EmojiSequenceAnalyzerPage } from "./pages/EmojiSequenceAnalyzerPage";

test.describe("emoji-sequence-analyzer", () => {
  let tool: EmojiSequenceAnalyzerPage;

  test.beforeEach(async ({ page }) => {
    tool = new EmojiSequenceAnalyzerPage(page);
    await tool.goto();
  });

  test("образец: 8 эмодзи-кластеров и 10 остальных символов", async () => {
    await expect(tool.stat("es-emoji")).toHaveText("8");
    await expect(tool.stat("es-other")).toHaveText("10");
    await expect(tool.rows).toHaveCount(8);
  });

  test("виды кластеров идут в порядке текста", async () => {
    const kinds = await tool.rows.evaluateAll((rows) => rows.map((r) => r.getAttribute("data-kinds")));
    expect(kinds).toEqual(["skin-tone", "zwj", "flag", "keycap", "emoji-presentation", "text-presentation", "emoji", "tag-flag"]);
  });

  test("семья из ZWJ состоит из 3 частей и занимает 8 единиц UTF-16", async () => {
    await expect(tool.rows.nth(1)).toHaveAttribute("data-parts", "3");
    await expect(tool.rows.nth(1)).toHaveAttribute("data-utf16", "8");
  });

  test("образец вызывает пояснения про флаги, ZWJ, VS15, VS16 и теговый флаг", async () => {
    for (const code of ["flag-windows", "zwj-fallback", "vs15", "no-vs16", "tag-flag"]) {
      await expect(tool.note(code)).toBeVisible();
    }
  });

  test("текст без эмодзи показывает пустой результат", async () => {
    await tool.text.fill("plain text");

    await expect(tool.none).toBeVisible();
    await expect(tool.stat("es-emoji")).toHaveText("0");
  });
});
