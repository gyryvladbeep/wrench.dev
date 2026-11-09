import { test, expect } from "@playwright/test";
import { PlaywrightWebsocketMockGeneratorPage } from "./pages/PlaywrightWebsocketMockGeneratorPage";

test.describe("playwright-websocket-mock-generator", () => {
  let tool: PlaywrightWebsocketMockGeneratorPage;

  test.beforeEach(async ({ page }) => {
    tool = new PlaywrightWebsocketMockGeneratorPage(page);
    await tool.goto();
  });

  test("по умолчанию генерирует routeWebSocket с шаблоном socket.io", async () => {
    await expect(tool.output).toContainText("page.routeWebSocket");
    await expect(tool.output).toContainText("**/socket.io/**");
  });

  test("без закрытия соединения ws.close в тесте нет", async () => {
    await expect(tool.output).not.toContainText("ws.close(");
  });

  test("закрытие через 500 мс добавляет ws.close с кодом 1001", async () => {
    await tool.closeAfter.fill("500");

    await expect(tool.output).toContainText("ws.close({ code: 1001");
    await expect(tool.output).toContainText("server restart");
  });

  test("свой код закрытия 4000 попадает в тест", async () => {
    await tool.closeAfter.fill("500");
    await tool.code.fill("4000");

    await expect(tool.output).toContainText("code: 4000");
  });

  test("режим прокси подключается к настоящему серверу", async () => {
    await tool.mode.selectOption("proxy");

    await expect(tool.output).toContainText("connectToServer");
  });

  test("свой шаблон адреса подставляется в код", async () => {
    await tool.pattern.fill("**/ws/chat");

    await expect(tool.output).toContainText("**/ws/chat");
  });
});
