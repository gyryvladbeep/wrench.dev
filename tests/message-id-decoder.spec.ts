import { test, expect } from "@playwright/test";
import { MessageIdDecoderPage } from "./pages/MessageIdDecoderPage";

test.describe("Message ID Decoder", () => {
  let tool: MessageIdDecoderPage;

  test.beforeEach(async ({ page }) => {
    tool = new MessageIdDecoderPage(page);
    await tool.goto();
  });

  test("лента по умолчанию: третье сообщение раньше второго, последняя строка не ID", async () => {
    await expect(tool.rows).toHaveCount(5);
    expect(await tool.statuses()).toEqual(["ok", "ok", "out-of-order", "ok", "undecoded"]);
    await expect(tool.summary).toContainText("out of order: 1");
  });

  test("Slack ts 1700000000.000100 расшифровывается как 2023-11-14T22:13:20 UTC", async () => {
    await expect(tool.rows.first()).toContainText("Slack ts");
    await expect(tool.rows.first()).toContainText("2023-11-14T22:13:20.000Z");
  });

  test("по одному ID каждого типа: все распознаны и идут по возрастанию времени", async () => {
    await tool.typesSample.click();

    await expect(tool.rows).toHaveCount(6);
    expect(await tool.statuses()).toEqual(["ok", "ok", "ok", "ok", "ok", "ok"]);
    await expect(tool.rows.nth(0)).toContainText("MongoDB ObjectId");
    await expect(tool.rows.nth(2)).toContainText("ULID");
    await expect(tool.rows.nth(5)).toContainText("UUID v7");
  });

  test("ULID 01ARZ3NDEKTSV4RRFFQ69G5FAV даёт 2016-07-30T23:54:10.259Z", async () => {
    await tool.ids.fill("01ARZ3NDEKTSV4RRFFQ69G5FAV");

    await expect(tool.rows.first()).toContainText("2016-07-30T23:54:10.259Z");
  });

  test("ObjectId 507f1f77bcf86cd799439011 даёт 2012-10-17T21:13:27Z", async () => {
    await tool.ids.fill("507f1f77bcf86cd799439011");

    await expect(tool.rows.first()).toContainText("2012-10-17T21:13:27.000Z");
  });

  test("пустые строки игнорируются, одна строка не может быть нарушением порядка", async () => {
    await tool.ids.fill("\n\n1700000000.000100\n\n");

    await expect(tool.rows).toHaveCount(1);
    await expect(tool.summary).toContainText("out of order: 0");
  });

  test("кнопка возвращает ленту с нарушением порядка", async () => {
    await tool.typesSample.click();
    await tool.feedSample.click();

    await expect(tool.rows).toHaveCount(5);
  });
});
