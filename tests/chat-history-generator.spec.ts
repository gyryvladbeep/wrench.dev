import { test, expect } from "@playwright/test";
import { ChatHistoryGeneratorPage } from "./pages/ChatHistoryGeneratorPage";

test.describe("Chat History Generator", () => {
  let tool: ChatHistoryGeneratorPage;

  test.beforeEach(async ({ page }) => {
    tool = new ChatHistoryGeneratorPage(page);
    await tool.goto();
  });

  test("по умолчанию 50 сообщений, из них 5 в тредах и 5 вложений при seed 42", async () => {
    await expect(tool.stat("count")).toHaveText("50");
    await expect(tool.stat("threads")).toHaveText("5");
    await expect(tool.stat("attachments")).toHaveText("5");
  });

  test("число сообщений меняет результат: 200 сообщений", async () => {
    await tool.count.fill("200");

    await expect(tool.stat("count")).toHaveText("200");
  });

  test("ноль сообщений поднимается до одного", async () => {
    await tool.count.fill("0");

    await expect(tool.stat("count")).toHaveText("1");
  });

  test("тот же seed возвращает тот же результат, другой seed — другой", async () => {
    const original = await tool.preview.innerText();
    await tool.seed.fill("7");
    const other = await tool.preview.innerText();
    await tool.seed.fill("42");

    expect(other).not.toBe(original);
    expect(await tool.preview.innerText()).toBe(original);
  });

  test("скачанный JSON содержит ровно 50 сообщений с возрастающим временем", async () => {
    const file = await tool.download();
    const messages = JSON.parse(file.text) as { id: string; ts: string; seq: number }[];

    expect(file.name).toBe("chat-history-50.json");
    expect(messages).toHaveLength(50);
    expect(new Set(messages.map((m) => m.id)).size).toBe(50);
    for (let i = 1; i < messages.length; i++) {
      expect(Date.parse(messages[i].ts)).toBeGreaterThanOrEqual(Date.parse(messages[i - 1].ts));
      expect(messages[i].seq).toBe(i + 1);
    }
  });

  test("NDJSON: одна строка на сообщение", async () => {
    await tool.format.selectOption("ndjson");
    const file = await tool.download();

    expect(file.name).toBe("chat-history-50.ndjson");
    expect(file.text.split("\n")).toHaveLength(50);
    expect(() => JSON.parse(file.text.split("\n")[0])).not.toThrow();
  });

  test("CSV начинается со строки заголовков", async () => {
    await tool.format.selectOption("csv");

    await expect(tool.preview).toContainText("id,ts,seq,channel,user_id,user_name,text");
    const file = await tool.download();
    expect(file.name).toBe("chat-history-50.csv");
  });

  test("все проценты по нулям: нет ни тредов, ни вложений", async ({ page }) => {
    for (const id of ["threadPct", "attachmentPct"]) await page.locator(`#ch-${id}`).fill("0");

    await expect(tool.stat("threads")).toHaveText("0");
    await expect(tool.stat("attachments")).toHaveText("0");
  });
});
