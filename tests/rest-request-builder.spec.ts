import { test, expect } from "@playwright/test";
import { RestRequestBuilderPage } from "./pages/RestRequestBuilderPage";

test.describe("REST Request Builder", () => {
  let tool: RestRequestBuilderPage;

  test.beforeEach(async ({ page }) => {
    tool = new RestRequestBuilderPage(page);
    await tool.goto();
  });

  test("успешный GET показывает статус и JSON-тело ответа", async () => {
    await tool.mockJsonResponse(200, "OK", { id: 1, completed: false });

    await tool.sendButton.click();

    await expect(tool.statusValue).toHaveText("200 OK");
    await expect(tool.responseBody).toHaveValue(JSON.stringify({ id: 1, completed: false }, null, 2));
  });

  test("метод GET не показывает поле body, DELETE тоже, а POST — показывает", async () => {
    await expect(tool.bodyTextarea).toHaveCount(0);

    await tool.setMethod("DELETE");
    await expect(tool.bodyTextarea).toHaveCount(0);

    await tool.setMethod("POST");
    await expect(tool.bodyTextarea).toBeVisible();
  });

  test("ошибка сети показывает сообщение и подсказку про CORS", async () => {
    await tool.mockNetworkFailure();

    await tool.sendButton.click();

    await expect(tool.errorText).toBeVisible();
    await expect(tool.page.getByText(/CORS/)).toBeVisible();
  });

  test("серверная ошибка (500) отображается статусом, а не как fetch-исключение", async () => {
    await tool.mockJsonResponse(500, "Internal Server Error", { error: "boom" });

    await tool.sendButton.click();

    await expect(tool.statusValue).toHaveText("500 Internal Server Error");
    await expect(tool.errorText).toHaveCount(0);
  });

  test("кнопка Copy response копирует тело ответа", async ({ context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await tool.mockJsonResponse(200, "OK", { hello: "world" });

    await tool.sendButton.click();
    await expect(tool.statusValue).toHaveText("200 OK");

    await tool.copyResponseButton.click();
    const clipboardText = await tool.page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(JSON.stringify({ hello: "world" }, null, 2));
  });

  test("POST отправляет введённое тело запроса", async () => {
    let sentBody = "";
    await tool.page.route("https://jsonplaceholder.typicode.com/**", async (route) => {
      sentBody = route.request().postData() ?? "";
      await route.fulfill({ status: 201, contentType: "application/json", body: "{}" });
    });

    await tool.setMethod("POST");
    await tool.bodyTextarea.fill('{"title":"test"}');
    await tool.sendButton.click();

    await expect(tool.statusValue).toHaveText("201 Created");
    expect(sentBody).toBe('{"title":"test"}');
  });
});
