import { test, expect } from "@playwright/test";
import { OsVersionReferencePage } from "./pages/OsVersionReferencePage";

test.describe("Android and iOS Version Reference", () => {
  let tool: OsVersionReferencePage;

  test.beforeEach(async ({ page }) => {
    tool = new OsVersionReferencePage(page);
    await tool.goto();
  });

  test("по умолчанию показан Android с уровнем API у каждой версии", async () => {
    await expect(tool.row("android", "17")).toContainText("API 37");
    await expect(tool.row("android", "14")).toContainText("API 34");
    await expect(tool.row("android", "8.0")).toContainText("API 26");
  });

  test("поиск по уровню API оставляет только нужную версию", async () => {
    await tool.search.fill("api 34");

    await expect(tool.row("android", "14")).toBeVisible();
    await expect(tool.row("android", "17")).toHaveCount(0);
  });

  test("поиск по ключевому слову находит версию с этим изменением", async () => {
    await tool.search.fill("POST_NOTIFICATIONS");

    await expect(tool.row("android", "13")).toBeVisible();
    await expect(tool.row("android", "14")).toHaveCount(0);
  });

  test("переключение на iOS показывает iOS 27 с датой выхода и скрывает Android", async () => {
    await tool.choosePlatform("iOS");

    await expect(tool.row("ios", "27")).toContainText("September 14, 2026");
    await expect(tool.row("android", "17")).toHaveCount(0);
  });

  test("запрос без совпадений показывает сообщение вместо пустого списка", async () => {
    await tool.search.fill("zzzz-nothing");

    await expect(tool.empty).toBeVisible();
  });
});
