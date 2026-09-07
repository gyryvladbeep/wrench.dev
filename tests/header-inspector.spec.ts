import { test, expect } from "@playwright/test";
import { HeaderInspectorPage } from "./pages/HeaderInspectorPage";

test.describe("Header Inspector", () => {
  let tool: HeaderInspectorPage;

  test.beforeEach(async ({ page }) => {
    tool = new HeaderInspectorPage(page);
    await tool.goto();
  });

  test("успешный ответ показывает статус и все заголовки построчно", async () => {
    await tool.mockResponse(200, {
      status: 200,
      statusText: "OK",
      headers: { "content-type": "text/html; charset=utf-8", "x-powered-by": "Next.js" },
    });

    await tool.setUrl("https://example.com");
    await tool.inspectButton.click();

    await expect(tool.statusLine).toHaveText("200 OK");
    await expect(tool.headersPre).toContainText("content-type: text/html; charset=utf-8");
    await expect(tool.headersPre).toContainText("x-powered-by: Next.js");
  });

  test("ответ с ошибкой от API (400) показывает сообщение об ошибке, а не заголовки", async () => {
    await tool.mockResponse(400, { error: "Provide a valid http(s) URL." });

    await tool.setUrl("not-a-url");
    await tool.inspectButton.click();

    await expect(tool.errorText).toHaveText("Provide a valid http(s) URL.");
    await expect(tool.headersPre).toBeHidden();
  });

  test("обрыв сети — показывается networkError, а не необработанное исключение", async () => {
    await tool.mockNetworkFailure();

    await tool.setUrl("https://example.com");
    await tool.inspectButton.click();

    await expect(tool.errorText).toHaveText("Network error — couldn't reach the server.");
  });

  test("во время запроса кнопка показывает 'Checking…' и заблокирована", async () => {
    // Достаточно большая задержка мок-ответа, чтобы гарантированно успеть
    // проверить оба признака состояния loading (текст и disabled) — обе
    // проверки идут ПОСЛЕДОВАТЕЛЬНО, и на медленном раннере короткая
    // задержка (например 400мс) может истечь между ними.
    await tool.mockResponse(200, { status: 200, statusText: "OK", headers: {} }, 2000);

    await tool.setUrl("https://example.com");
    await tool.inspectButton.click();

    await Promise.all([
      expect(tool.inspectButton).toHaveText("Checking…"),
      expect(tool.inspectButton).toBeDisabled(),
    ]);

    await expect(tool.inspectButton).toHaveText("Inspect", { timeout: 5000 });
  });

  test("повторный запрос очищает предыдущую ошибку и предыдущий результат", async () => {
    await tool.mockResponse(400, { error: "Provide a valid http(s) URL." });
    await tool.setUrl("bad");
    await tool.inspectButton.click();
    await expect(tool.errorText).toBeVisible();

    await tool.page.unroute("**/api/headers");
    await tool.mockResponse(200, { status: 200, statusText: "OK", headers: { "content-type": "text/plain" } });
    await tool.setUrl("https://example.com");
    await tool.inspectButton.click();

    await expect(tool.errorText).toBeHidden();
    await expect(tool.statusLine).toHaveText("200 OK");
  });

  test("кнопка Copy копирует заголовки в формате 'key: value' по одному на строку", async ({ context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await tool.mockResponse(200, {
      status: 200,
      statusText: "OK",
      headers: { "content-type": "application/json", "cache-control": "no-cache" },
    });

    await tool.setUrl("https://example.com");
    await tool.inspectButton.click();
    await expect(tool.statusLine).toHaveText("200 OK");

    await tool.copyButton.click();
    const clipboardText = await tool.page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe("content-type: application/json\ncache-control: no-cache");
  });
});
