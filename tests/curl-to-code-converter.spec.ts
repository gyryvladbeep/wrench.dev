import { test, expect } from "@playwright/test";
import { CurlToCodeConverterPage } from "./pages/CurlToCodeConverterPage";

test.describe("Curl to Code Converter", () => {
  let tool: CurlToCodeConverterPage;

  test.beforeEach(async ({ page }) => {
    tool = new CurlToCodeConverterPage(page);
    await tool.goto();
  });

  test("значения по умолчанию: POST с JSON-телом распознаётся, вкладка fetch показывает верный код", async () => {
    await expect(tool.summaryBar).toContainText("POST");
    await expect(tool.summaryBar).toContainText("https://api.example.com/v1/users");
    await expect(tool.summaryBar).toContainText("2 headers");

    const code = await tool.codeText();
    expect(code).toContain('fetch("https://api.example.com/v1/users"');
    expect(code).toContain('method: "POST"');
    expect(code).toContain('"Content-Type": "application/json"');
    expect(code).toContain("JSON.stringify(");
    expect(code).toContain('"name": "Ada Lovelace"');
  });

  test("вкладка Python (requests) генерирует эквивалентный код", async () => {
    await tool.selectLang("Python (requests)");
    const code = await tool.codeText();
    expect(code).toContain("import requests");
    expect(code).toContain("headers = {");
    expect(code).toContain('"Content-Type": "application/json"');
    expect(code).toContain("json_data = {");
    expect(code).toContain("requests.post(");
  });

  test("вкладка Node.js (axios) генерирует эквивалентный код", async () => {
    await tool.selectLang("Node.js (axios)");
    const code = await tool.codeText();
    expect(code).toContain('require("axios")');
    expect(code).toContain("axios.post(");
    expect(code).toContain('"Content-Type": "application/json"');
  });

  test("вкладка PowerShell генерирует эквивалентный код", async () => {
    await tool.selectLang("PowerShell");
    const code = await tool.codeText();
    expect(code).toContain("Invoke-RestMethod");
    expect(code).toContain("-Method POST");
    expect(code).toContain("$headers = @{");
    expect(code).toContain('-ContentType "application/json"');
  });

  test("GET-запрос без тела определяется как GET, без body в коде", async () => {
    await tool.setCurl("curl https://example.com/health");
    await expect(tool.summaryBar).toContainText("GET");

    const code = await tool.codeText();
    expect(code).toContain('method: "GET"');
    expect(code).not.toContain("body:");
  });

  test("флаг -u кодирует Basic auth заголовок в сгенерированном коде", async () => {
    await tool.setCurl("curl -u admin:secret123 https://api.example.com/private");
    const code = await tool.codeText();
    expect(code).toContain("Authorization");
    expect(code).toContain("Basic YWRtaW46c2VjcmV0MTIz");
  });

  test("пустой ввод показывает подсказку вставить команду, без блока кода", async () => {
    await tool.setCurl("");
    // exact: true — та же фраза встречается частично в описании и в howToSteps ниже на странице.
    await expect(tool.page.getByText("Paste a curl command", { exact: true })).toBeVisible();
    await expect(tool.codeOutput).toHaveCount(0);
  });
});
