import { test, expect } from "@playwright/test";
import { UrlParserPage } from "./pages/UrlParserPage";

test.describe("URL Parser", () => {

  let tool: UrlParserPage;

  test.beforeEach(async ({ page }) => {
    tool = new UrlParserPage(page);
    await tool.goto();
  });

  test("пример URL по умолчанию разбирается на правильные части", async () => {
    // Дефолтный SAMPLE в UrlParserTool.tsx:
    // https://api.example.com:8080/v1/users?role=admin&active=true&page=2#results
    await expect(tool.row("Protocol")).toHaveText("https");
    await expect(tool.row("Host")).toHaveText("api.example.com");
    await expect(tool.row("Port")).toHaveText("8080");
    await expect(tool.row("Path")).toHaveText("/v1/users");
    await expect(tool.row("Query string")).toHaveText("role=admin&active=true&page=2");
    await expect(tool.row("Fragment / Hash")).toHaveText("results");
    await expect(tool.row("Origin")).toHaveText("https://api.example.com:8080");

    await expect(tool.queryParam("role")).toHaveText("admin");
    await expect(tool.queryParam("active")).toHaveText("true");
    await expect(tool.queryParam("page")).toHaveText("2");
  });

  test("https помечается как 'secure'", async () => {
    await expect(tool.page.getByText("secure", { exact: true })).toBeVisible();
  });

  test("http без явного порта получает порт по умолчанию 80 и бейдж 'insecure'", async () => {
    await tool.setUrl("http://plain-example.com/path");
    await expect(tool.row("Port")).toHaveText("80");
    await expect(tool.page.getByText("insecure", { exact: true })).toBeVisible();
  });

  test("URL без query string и хэша показывает '—' в этих строках", async () => {
    await tool.setUrl("https://example.com/only/path");
    await expect(tool.row("Query string")).toHaveText("—");
    await expect(tool.row("Fragment / Hash")).toHaveText("—");
  });

  test("невалидный URL показывает ошибку вместо таблицы разбора", async () => {
    await tool.setUrl("совсем не url");
    await expect(tool.page.getByText("Invalid URL")).toBeVisible();
    await expect(tool.row("Protocol")).toBeHidden();
  });

  test("очистка поля убирает и таблицу, и сообщение об ошибке", async () => {
    await tool.setUrl("");
    await expect(tool.page.getByText("Invalid URL")).toBeHidden();
    await expect(tool.row("Protocol")).toBeHidden();
  });

});
