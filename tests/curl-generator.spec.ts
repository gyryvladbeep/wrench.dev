import { test, expect } from "@playwright/test";
import { CurlGeneratorPage } from "./pages/CurlGeneratorPage";

// Точная копия shQuote()/command из components/tools/CurlGeneratorTool.tsx.
interface HeaderRow { key: string; value: string; }

function shQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function buildCommand(method: string, url: string, headers: HeaderRow[], body: string): string {
  const parts = ["curl", "-X", method];
  headers
    .filter((h) => h.key.trim())
    .forEach((h) => parts.push("-H", shQuote(`${h.key}: ${h.value}`)));
  if (body.trim() && method !== "GET") {
    parts.push("-d", shQuote(body));
  }
  parts.push(shQuote(url || ""));
  return parts.join(" \\\n  ");
}

const DEFAULT_HEADERS: HeaderRow[] = [{ key: "Content-Type", value: "application/json" }];
const DEFAULT_BODY = '{\n  "name": "Ada"\n}';

test.describe("Curl Generator", () => {
  let tool: CurlGeneratorPage;

  test.beforeEach(async ({ page }) => {
    tool = new CurlGeneratorPage(page);
    await tool.goto();
  });

  test("по умолчанию GET-команда не включает body, даже если поле body заполнено", async () => {
    const expected = buildCommand("GET", "https://api.example.com/v1/users", DEFAULT_HEADERS, DEFAULT_BODY);
    await expect(tool.command).toHaveText(expected);
    await expect(tool.command).not.toContainText("-d");
  });

  test("смена метода на POST показывает поле body и добавляет -d в команду", async () => {
    await tool.setMethod("POST");
    await expect(tool.bodyTextarea).toBeVisible();

    const expected = buildCommand("POST", "https://api.example.com/v1/users", DEFAULT_HEADERS, DEFAULT_BODY);
    await expect(tool.command).toHaveText(expected);
    await expect(tool.command).toContainText("-d");
  });

  test("добавление заголовка добавляет -H в команду", async () => {
    await tool.addHeaderButton.click();
    await tool.headerNameInput(1).fill("Authorization");
    await tool.headerValueInput(1).fill("Bearer token123");

    const expected = buildCommand("GET", "https://api.example.com/v1/users",
      [...DEFAULT_HEADERS, { key: "Authorization", value: "Bearer token123" }], DEFAULT_BODY);
    await expect(tool.command).toHaveText(expected);
    await expect(tool.command).toContainText("Authorization: Bearer token123");
  });

  test("удаление заголовка убирает соответствующий -H из команды", async () => {
    await tool.removeHeaderButton(0).click();

    const expected = buildCommand("GET", "https://api.example.com/v1/users", [], DEFAULT_BODY);
    await expect(tool.command).toHaveText(expected);
    await expect(tool.command).not.toContainText("Content-Type");
  });

  test("одинарная кавычка в значении заголовка экранируется POSIX-safe способом", async () => {
    await tool.headerValueInput(0).fill("it's a test");

    const expected = buildCommand("GET", "https://api.example.com/v1/users",
      [{ key: "Content-Type", value: "it's a test" }], DEFAULT_BODY);
    await expect(tool.command).toHaveText(expected);
    // '\'' — закрыли кавычку, экранировали саму кавычку, открыли заново.
    await expect(tool.command).toContainText(`it'\\''s a test`);
  });

  test("кнопка Copy копирует итоговую команду целиком", async ({ context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await tool.copyButton.click();

    const expected = buildCommand("GET", "https://api.example.com/v1/users", DEFAULT_HEADERS, DEFAULT_BODY);
    const clipboardText = await tool.page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(expected);
  });
});
