import { test, expect } from "@playwright/test";
import { ApiResponseMockerPage } from "./pages/ApiResponseMockerPage";

test.describe("API Response Mocker", () => {

  let mocker: ApiResponseMockerPage;

  test.beforeEach(async ({ page }) => {
    mocker = new ApiResponseMockerPage(page);
    await mocker.goto();
  });

  test("страница открывается и сразу показывает готовый сниппет", async () => {
    // На странице уже есть пример JSON по умолчанию — сниппет
    // должен появиться сразу, без каких-либо действий пользователя
    const snippet = await mocker.getSnippetText();
    expect(snippet.length).toBeGreaterThan(20);
  });

  test("по умолчанию выбран формат MSW", async () => {
    const snippet = await mocker.getSnippetText();

    // MSW-сниппет должен содержать характерный импорт
    expect(snippet).toContain("msw");
    expect(snippet).toContain("HttpResponse");
  });

  test("переключение на json-server меняет содержимое сниппета", async () => {
    await mocker.selectFormat("json-server");

    const snippet = await mocker.getSnippetText();
    expect(snippet).toContain("json-server");
    expect(snippet).toContain("db.json");
  });

  test("переключение на Express route меняет содержимое сниппета", async () => {
    await mocker.selectFormat("Express route");

    const snippet = await mocker.getSnippetText();
    expect(snippet).toContain("express");
    expect(snippet).toContain("app.listen");
  });

  test("переключение на Postman mock генерирует валидный JSON", async () => {
    await mocker.selectFormat("Postman mock");

    const snippet = await mocker.getSnippetText();

    // ─────────────────────────────────────────────────────────
    // УРОК: раз сниппет для Postman — это JSON-файл, можем проверить
    // его строже, чем просто "содержит подстроку" — распарсить его
    // целиком и убедиться что это ВАЛИДНЫЙ JSON с ожидаемой структурой.
    // Это более надёжная проверка, чем просто toContain().
    // ─────────────────────────────────────────────────────────
    let parsed: unknown;
    expect(() => { parsed = JSON.parse(snippet); }).not.toThrow();
    expect(parsed).toHaveProperty("response");
  });

  test("невалидный JSON в поле ввода убирает сниппет и показывает ошибку", async () => {
    await mocker.setJson('{"broken": ');

    await expect(mocker.page.getByText(/invalid json/i)).toBeVisible();

    // Сниппет должен исчезнуть, раз входные данные сломаны —
    // приложение не должно пытаться сгенерировать мок из мусора
    const preCount = await mocker.snippetOutput.count();
    expect(preCount).toBe(0);
  });

  test("изменение URL отражается в сгенерированном сниппете", async () => {
    await mocker.urlInput.fill("/api/orders/:orderId");

    const snippet = await mocker.getSnippetText();
    expect(snippet).toContain("/api/orders/:orderId");
  });

});