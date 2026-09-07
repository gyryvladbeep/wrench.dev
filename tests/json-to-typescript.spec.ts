import { test, expect } from "@playwright/test";
import { JsonToTypescriptPage } from "./pages/JsonToTypescriptPage";

// Точная копия jsonToTs()/buildInterfaces() из components/tools/JsonToTypescriptTool.tsx —
// считаем ожидаемый TS так же, как считает сама страница, а не выводим вручную
// (риск опечататься в отступах/скобках при ручном наборе).
function jsonToTs(json: unknown, name = "Root", depth = 0): string {
  if (json === null) return "null";
  if (typeof json === "string")  return "string";
  if (typeof json === "number")  return "number";
  if (typeof json === "boolean") return "boolean";
  if (Array.isArray(json)) {
    if (json.length === 0) return "unknown[]";
    const types = [...new Set(json.map((v) => jsonToTs(v, name, depth)))];
    return types.length === 1 ? `${types[0]}[]` : `(${types.join(" | ")})[]`;
  }
  if (typeof json === "object") {
    const entries = Object.entries(json as Record<string, unknown>);
    if (entries.length === 0) return "Record<string, unknown>";
    const indent = "  ".repeat(depth + 1);
    const fields = entries.map(([k, v]) => {
      const key = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : `"${k}"`;
      const isOpt = v === null || v === undefined;
      const type = jsonToTs(v, k.charAt(0).toUpperCase() + k.slice(1), depth + 1);
      return `${indent}${key}${isOpt ? "?" : ""}: ${type};`;
    }).join("\n");
    return `{\n${fields}\n${"  ".repeat(depth)}}`;
  }
  return "unknown";
}

function buildInterfaces(json: unknown, rootName = "Root"): string {
  const interfaces: string[] = [];
  function process(obj: unknown, name: string): string {
    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return jsonToTs(obj, name);
    const entries = Object.entries(obj as Record<string, unknown>);
    const fields = entries.map(([k, v]) => {
      const key = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : `"${k}"`;
      const childName = k.charAt(0).toUpperCase() + k.slice(1);
      let type: string;
      if (typeof v === "object" && v !== null && !Array.isArray(v)) {
        type = childName; process(v, childName);
      } else if (Array.isArray(v) && v.length > 0 && typeof v[0] === "object" && v[0] !== null) {
        type = `${childName}Item[]`; process(v[0], `${childName}Item`);
      } else {
        type = jsonToTs(v, childName);
      }
      const isOpt = v === null || v === undefined;
      return `  ${key}${isOpt ? "?" : ""}: ${type};`;
    }).join("\n");
    interfaces.unshift(`export interface ${name} {\n${fields}\n}\n`);
    return name;
  }
  process(json, rootName);
  return interfaces.join("\n");
}

const SAMPLE = `{
  "user": {
    "id": 1,
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "roles": ["admin", "user"],
    "address": {
      "city": "London",
      "zip": "W1A 1AA"
    }
  },
  "active": true,
  "score": null
}`;

test.describe("JSON to TypeScript", () => {
  let tool: JsonToTypescriptPage;

  test.beforeEach(async ({ page }) => {
    tool = new JsonToTypescriptPage(page);
    await tool.goto();
  });

  test("дефолтный SAMPLE — вложенные interface Root/User/Address, score опционален (null)", async () => {
    const expected = buildInterfaces(JSON.parse(SAMPLE), "Root");

    await expect(tool.output).toHaveValue(expected);
    await expect(tool.output).toHaveValue(/score\?: null;/);
    await expect(tool.output).toHaveValue(/roles: string\[\];/);
  });

  test("смена имени корневого интерфейса на 'ApiResponse' переименовывает только корень", async () => {
    await tool.setRootName("ApiResponse");
    const expected = buildInterfaces(JSON.parse(SAMPLE), "ApiResponse");

    await expect(tool.output).toHaveValue(expected);
    await expect(tool.output).toHaveValue(/export interface ApiResponse \{/);
    await expect(tool.output).toHaveValue(/export interface User \{/);
  });

  test("массив объектов даёт '<Name>Item[]' и отдельный интерфейс для элемента", async () => {
    const input = `{"items":[{"id":1,"label":"a"},{"id":2,"label":"b"}]}`;
    await tool.setInput(input);
    const expected = buildInterfaces(JSON.parse(input), "Root");

    await expect(tool.output).toHaveValue(expected);
    await expect(tool.output).toHaveValue(/items: ItemsItem\[\];/);
    await expect(tool.output).toHaveValue(/export interface ItemsItem \{/);
  });

  test("невалидный JSON — показывается точный текст ошибки браузера", async () => {
    const badJson = "{broken";
    const expectedMessage = await tool.page.evaluate((bad) => {
      try { JSON.parse(bad); return null; } catch (e) { return (e as Error).message; }
    }, badJson);

    await tool.setInput(badJson);

    await expect(tool.errorMessage).toHaveText(expectedMessage!);
  });

  test("пустой ввод — пустой вывод (плейсхолдер вместо textarea)", async () => {
    await tool.setInput("");

    await expect(tool.output).toBeHidden();
    await expect(tool.errorMessage).toBeHidden();
  });
});
