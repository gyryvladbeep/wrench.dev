import { test, expect } from "@playwright/test";
import { PushPayloadValidatorPage } from "./pages/PushPayloadValidatorPage";

test.describe("Push Payload Validator", () => {
  let tool: PushPayloadValidatorPage;

  test.beforeEach(async ({ page }) => {
    tool = new PushPayloadValidatorPage(page);
    await tool.goto();
  });

  test("пример APNs по умолчанию весит 148 байт из 4096 и не имеет замечаний", async () => {
    await expect(tool.size).toHaveText("148 / 4096 bytes");
    await expect(tool.findings).toContainText("No issues found");
  });

  test("переключение на FCM показывает пример FCM со своим размером", async () => {
    await tool.choosePlatform("FCM HTTP v1 (Android)");

    await expect(tool.size).toHaveText("239 / 4096 bytes");
    await expect(tool.findings).toContainText("No issues found");
  });

  test("галочка VoIP поднимает лимит APNs до 5120 байт", async () => {
    await tool.voip.check();

    await expect(tool.size).toHaveText("148 / 5120 bytes");
  });

  test("для FCM галочки VoIP нет", async () => {
    await tool.choosePlatform("FCM HTTP v1 (Android)");

    await expect(tool.voip).toHaveCount(0);
  });

  test("некорректный JSON даёт ошибку и неизвестный размер", async () => {
    await tool.setPayload("{broken");

    await expect(tool.finding("json-invalid")).toHaveAttribute("data-level", "error");
    await expect(tool.size).toContainText("invalid JSON");
  });

  test("свой ключ внутри aps и badge-строка дают замечания", async () => {
    await tool.setPayload('{"aps":{"alert":"x","foo":1,"badge":"1"}}');

    await expect(tool.finding("aps-unknown-key")).toHaveAttribute("data-level", "warning");
    await expect(tool.finding("badge-type")).toHaveAttribute("data-level", "error");
  });

  test("пейлоад больше 4096 байт помечается как слишком большой, а для VoIP проходит", async () => {
    await tool.setPayload(JSON.stringify({ aps: { alert: "a".repeat(4100) } }));
    await expect(tool.finding("too-large")).toHaveAttribute("data-level", "error");

    await tool.voip.check();
    await expect(tool.finding("too-large")).toHaveCount(0);
  });

  test("content-available вместе с alert помечается как не silent push", async () => {
    await tool.setPayload('{"aps":{"content-available":1,"alert":"hi"}}');

    await expect(tool.finding("not-silent")).toBeVisible();
  });

  test("FCM: число в data, зарезервированный ключ и две цели сразу дают ошибки", async () => {
    await tool.choosePlatform("FCM HTTP v1 (Android)");
    await tool.setPayload('{"message":{"token":"t","topic":"x","data":{"count":5,"gcm.key":"v"}}}');

    await expect(tool.finding("fcm-multi-target")).toBeVisible();
    await expect(tool.finding("fcm-data-value")).toBeVisible();
    await expect(tool.finding("fcm-reserved-key")).toBeVisible();
  });

  test("FCM: неверный формат TTL и приоритет в нижнем регистре", async () => {
    await tool.choosePlatform("FCM HTTP v1 (Android)");
    await tool.setPayload('{"message":{"token":"t","android":{"priority":"high","ttl":"60"}}}');

    await expect(tool.finding("fcm-ttl")).toHaveAttribute("data-level", "error");
    await expect(tool.finding("fcm-priority")).toHaveAttribute("data-level", "warning");
  });

  test("FCM без обёртки message даёт ошибку структуры", async () => {
    await tool.choosePlatform("FCM HTTP v1 (Android)");
    await tool.setPayload('{"token":"t"}');

    await expect(tool.finding("fcm-no-message")).toBeVisible();
  });

  test("текст каждой платформы хранится отдельно при переключении", async () => {
    await tool.setPayload('{"aps":{"badge":3}}');
    await tool.choosePlatform("FCM HTTP v1 (Android)");
    await tool.choosePlatform("APNs (iOS)");

    await expect(tool.input).toHaveValue('{"aps":{"badge":3}}');
  });
});
