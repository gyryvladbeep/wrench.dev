import { test, expect } from "@playwright/test";
import { ChatEventSequenceValidatorPage } from "./pages/ChatEventSequenceValidatorPage";

const CLEAN = JSON.stringify([
  { id: "a", seq: 1, ts: "2026-01-01T00:00:00Z", channel: "x" },
  { id: "b", seq: 2, ts: "2026-01-01T00:00:01Z", channel: "x" },
]);

test.describe("Chat Event Sequence Validator", () => {
  let tool: ChatEventSequenceValidatorPage;

  test.beforeEach(async ({ page }) => {
    tool = new ChatEventSequenceValidatorPage(page);
    await tool.goto();
  });

  test("образец: 7 событий в 2 группах и 5 проблем", async () => {
    await expect(tool.stat("total")).toHaveText("7");
    await expect(tool.stat("groups")).toHaveText("2");
    await expect(tool.stat("issues")).toHaveText("5");
  });

  test("образец содержит дубль id, пропуск, нарушение порядка, дубль seq и откат времени", async () => {
    for (const code of ["duplicate-id", "gap", "out-of-order", "duplicate-seq", "timestamp-regression"]) {
      await expect(tool.finding(code)).toBeVisible();
    }
  });

  test("пропуск называет диапазон 5-6 в канале general", async () => {
    await expect(tool.finding("gap")).toContainText("5-6");
    await expect(tool.finding("gap")).toContainText("general");
  });

  test("чистая последовательность даёт одно замечание ok и 0 проблем", async () => {
    await tool.events.fill(CLEAN);

    await expect(tool.findings).toHaveCount(1);
    await expect(tool.finding("ok")).toBeVisible();
    await expect(tool.stat("issues")).toHaveText("0");
  });

  test("NDJSON принимается так же, как массив", async () => {
    await tool.events.fill(
      '{"id":"a","seq":1,"ts":"2026-01-01T00:00:00Z","channel":"x"}\n{"id":"b","seq":2,"ts":"2026-01-01T00:00:01Z","channel":"x"}'
    );

    await expect(tool.stat("total")).toHaveText("2");
    await expect(tool.finding("ok")).toBeVisible();
  });

  test("некорректный JSON показывает ошибку с номером строки", async () => {
    await tool.events.fill("{not json");

    await expect(tool.error).toContainText("Line 1");
  });

  test("если очистить поле группы, события проверяются как одна последовательность", async () => {
    await tool.groupKey.fill("");

    await expect(tool.stat("groups")).toHaveText("1");
  });

  test("переименование поля id убирает проверку дублей и сообщает об отсутствующем поле", async () => {
    await tool.idKey.fill("messageId");

    await expect(tool.finding("missing-id")).toBeVisible();
  });
});
