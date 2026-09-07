import { test, expect } from "@playwright/test";
import { ApiRequestBuilderPage } from "./pages/ApiRequestBuilderPage";

test.describe("API Request Builder", () => {
  let tool: ApiRequestBuilderPage;

  test.beforeEach(async ({ page }) => {
    tool = new ApiRequestBuilderPage(page);
    await tool.goto();
  });

  test("успешный GET показывает статус, тело ответа и время выполнения", async () => {
    await tool.mockJsonResponse(200, "OK", { id: 1, title: "foo" }, { "content-type": "application/json" });

    await tool.sendButton.click();

    await expect(tool.statusValue).toHaveText("200 OK");
    await expect(tool.timeValue).toBeVisible();
    await expect(tool.responseBody).toHaveValue(JSON.stringify({ id: 1, title: "foo" }, null, 2));
  });

  test("query-параметры добавляются в URL как query string", async () => {
    let requestedUrl = "";
    await tool.page.route("https://jsonplaceholder.typicode.com/**", async (route) => {
      requestedUrl = route.request().url();
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    await tool.paramNameInput(0).fill("userId");
    await tool.paramValueInput(0).fill("5");
    await tool.sendButton.click();

    await expect(tool.statusValue).toHaveText("200 OK");
    expect(requestedUrl).toContain("userId=5");
  });

  test("не-JSON ответ (text/plain) показывается как обычный текст, а не JSON.stringify", async () => {
    await tool.page.route("https://jsonplaceholder.typicode.com/**", async (route) => {
      await route.fulfill({ status: 200, contentType: "text/plain", body: "plain text response" });
    });

    await tool.sendButton.click();

    await expect(tool.statusValue).toHaveText("200 OK");
    await expect(tool.responseBody).toHaveValue("plain text response");
  });

  test("ошибка сети показывает сообщение об ошибке и подсказку про CORS/curl", async () => {
    await tool.mockNetworkFailure();

    await tool.sendButton.click();

    await expect(tool.errorText).toBeVisible();
    await expect(tool.page.getByText(/CORS/)).toBeVisible();
  });

  test("серверная ошибка (404) отображается статусом 404, а не как fetch-ошибка", async () => {
    await tool.mockJsonResponse(404, "Not Found", { error: "not found" });

    await tool.sendButton.click();

    await expect(tool.statusValue).toHaveText("404 Not Found");
    await expect(tool.errorText).toHaveCount(0);
  });

  test("Request preview отражает метод, URL и заголовки перед отправкой", async () => {
    await tool.requestPreviewToggle.click();
    await expect(tool.requestPreview).toContainText("GET https://jsonplaceholder.typicode.com/posts/1");
    await expect(tool.requestPreview).toContainText("Accept: application/json");
  });
});
