import { test, expect } from "@playwright/test";
import { RealtimeFrameDecoderPage } from "./pages/RealtimeFrameDecoderPage";

test.describe("Realtime Frame Decoder", () => {
  let tool: RealtimeFrameDecoderPage;

  test.beforeEach(async ({ page }) => {
    tool = new RealtimeFrameDecoderPage(page);
    await tool.goto();
  });

  test("образец: 8 кадров, 2 события, 1 подтверждение, ping и pong по одному", async () => {
    await expect(tool.stat("total")).toHaveText("8");
    await expect(tool.stat("events")).toHaveText("2");
    await expect(tool.stat("acks")).toHaveText("1");
    await expect(tool.stat("pings")).toHaveText("1");
    await expect(tool.stat("pongs")).toHaveText("1");
  });

  test("первый кадр образца — Engine.IO open, второй — Socket.IO CONNECT", async () => {
    await expect(tool.frames.nth(0)).toHaveAttribute("data-protocol", "engine.io");
    await expect(tool.frames.nth(0)).toHaveAttribute("data-kind", "open");
    await expect(tool.frames.nth(1)).toHaveAttribute("data-protocol", "socket.io");
    await expect(tool.frames.nth(1)).toHaveAttribute("data-kind", "CONNECT");
  });

  test("кадр STOMP SEND разбирается по заголовкам", async () => {
    await tool.input.fill("SEND\ndestination:/app/chat\n\nhello");

    await expect(tool.frames).toHaveCount(1);
    await expect(tool.frames.first()).toHaveAttribute("data-protocol", "stomp");
    await expect(tool.frames.first()).toContainText("/app/chat");
  });

  test("запрос JSON-RPC распознаётся", async () => {
    await tool.input.fill('{"jsonrpc":"2.0","id":1,"method":"chat.send","params":{"text":"hi"}}');

    await expect(tool.frames.first()).toHaveAttribute("data-protocol", "json-rpc");
  });

  test("обычный JSON и простой текст не ломают разбор", async () => {
    await tool.input.fill('{"type":"typing"}\nhello');

    await expect(tool.frames).toHaveCount(2);
    await expect(tool.frames.nth(0)).toHaveAttribute("data-protocol", "json");
    await expect(tool.frames.nth(1)).toHaveAttribute("data-protocol", "text");
  });

  test("пустой ввод даёт ноль кадров", async () => {
    await tool.input.fill("");

    await expect(tool.stat("total")).toHaveText("0");
    await expect(tool.frames).toHaveCount(0);
  });
});
