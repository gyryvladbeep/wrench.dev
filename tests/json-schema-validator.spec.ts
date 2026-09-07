import { test, expect } from "@playwright/test";
import { JsonSchemaValidatorPage } from "./pages/JsonSchemaValidatorPage";

// Точная копия validateJsonSchema() из components/tools/JsonSchemaValidatorTool.tsx.
interface ValidationError { path: string; message: string; }

function validateJsonSchema(data: unknown, schema: Record<string, unknown>, path = ""): ValidationError[] {
  const errors: ValidationError[] = [];
  const p = path || "root";

  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const actualType = data === null ? "null" : Array.isArray(data) ? "array" : typeof data;
    const intMatch = types.includes("integer") && Number.isInteger(data);
    if (!types.includes(actualType) && !intMatch) {
      errors.push({ path: p, message: `Expected type ${types.join("|")}, got ${actualType}` });
      return errors;
    }
  }
  if (schema.required && typeof data === "object" && data !== null && !Array.isArray(data)) {
    for (const req of schema.required as string[]) {
      if (!(req in (data as Record<string, unknown>))) {
        errors.push({ path: p, message: `Missing required property: "${req}"` });
      }
    }
  }
  if (schema.properties && typeof data === "object" && data !== null && !Array.isArray(data)) {
    const props = schema.properties as Record<string, Record<string, unknown>>;
    for (const [key, propSchema] of Object.entries(props)) {
      if (key in (data as Record<string, unknown>)) {
        errors.push(...validateJsonSchema((data as Record<string, unknown>)[key], propSchema, `${p}.${key}`));
      }
    }
  }
  if (schema.additionalProperties === false && typeof data === "object" && data !== null && !Array.isArray(data)) {
    const allowed = new Set(Object.keys((schema.properties as Record<string, unknown>) ?? {}));
    for (const key of Object.keys(data as Record<string, unknown>)) {
      if (!allowed.has(key)) errors.push({ path: `${p}.${key}`, message: `Additional property not allowed: "${key}"` });
    }
  }
  if (typeof data === "string") {
    if (typeof schema.minLength === "number" && data.length < schema.minLength)
      errors.push({ path: p, message: `String too short (min ${schema.minLength})` });
    if (typeof schema.maxLength === "number" && data.length > schema.maxLength)
      errors.push({ path: p, message: `String too long (max ${schema.maxLength})` });
    if (schema.pattern && !new RegExp(schema.pattern as string).test(data))
      errors.push({ path: p, message: `Does not match pattern: ${schema.pattern}` });
    if (schema.format === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data))
      errors.push({ path: p, message: `Invalid email format` });
    if (schema.format === "uri" && !/^https?:\/\/.+/.test(data))
      errors.push({ path: p, message: `Invalid URI format` });
  }
  if (typeof data === "number") {
    if (typeof schema.minimum === "number" && data < schema.minimum)
      errors.push({ path: p, message: `Value ${data} < minimum ${schema.minimum}` });
    if (typeof schema.maximum === "number" && data > schema.maximum)
      errors.push({ path: p, message: `Value ${data} > maximum ${schema.maximum}` });
  }
  if (Array.isArray(data)) {
    if (typeof schema.minItems === "number" && data.length < schema.minItems)
      errors.push({ path: p, message: `Array too short (min ${schema.minItems} items)` });
    if (typeof schema.maxItems === "number" && data.length > schema.maxItems)
      errors.push({ path: p, message: `Array too long (max ${schema.maxItems} items)` });
    if (schema.items) {
      data.forEach((item, i) => {
        errors.push(...validateJsonSchema(item, schema.items as Record<string, unknown>, `${p}[${i}]`));
      });
    }
  }
  return errors;
}

const SAMPLE_JSON = `{
  "name": "Ada Lovelace",
  "age": 28,
  "email": "ada@example.com",
  "active": true
}`;

const SAMPLE_SCHEMA = `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["name", "age", "email"],
  "properties": {
    "name": { "type": "string", "minLength": 1 },
    "age": { "type": "integer", "minimum": 0, "maximum": 150 },
    "email": { "type": "string", "format": "email" },
    "active": { "type": "boolean" }
  },
  "additionalProperties": false
}`;

test.describe("JSON Schema Validator", () => {
  let tool: JsonSchemaValidatorPage;

  test.beforeEach(async ({ page }) => {
    tool = new JsonSchemaValidatorPage(page);
    await tool.goto();
  });

  test("дефолтная пара JSON+схема валидна", async () => {
    const errors = validateJsonSchema(JSON.parse(SAMPLE_JSON), JSON.parse(SAMPLE_SCHEMA));
    expect(errors).toHaveLength(0);

    await expect(tool.validMessage).toBeVisible();
  });

  test("отсутствие обязательного поля 'email' — 1 ошибка 'Missing required property'", async () => {
    const badJson = `{"name":"Ada Lovelace","age":28,"active":true}`;
    const errors = validateJsonSchema(JSON.parse(badJson), JSON.parse(SAMPLE_SCHEMA));
    expect(errors).toEqual([{ path: "root", message: 'Missing required property: "email"' }]);

    await tool.setJson(badJson);

    await expect(tool.errorCountHeading).toHaveText("1 validation error(s)");
    await expect(tool.errorRows).toHaveCount(1);
    await expect(tool.errorRows.first()).toContainText('Missing required property: "email"');
  });

  test("лишнее поле при additionalProperties:false — 'Additional property not allowed'", async () => {
    const badJson = `{"name":"Ada Lovelace","age":28,"email":"ada@example.com","active":true,"extra":"x"}`;
    const errors = validateJsonSchema(JSON.parse(badJson), JSON.parse(SAMPLE_SCHEMA));
    expect(errors.some((e) => e.message.includes("Additional property not allowed"))).toBe(true);

    await tool.setJson(badJson);

    await expect(tool.errorRows.filter({ hasText: "Additional property not allowed" })).toHaveCount(1);
  });

  test("невалидный email и age вне диапазона — 2 ошибки одновременно", async () => {
    const badJson = `{"name":"Ada Lovelace","age":200,"email":"not-an-email","active":true}`;
    const errors = validateJsonSchema(JSON.parse(badJson), JSON.parse(SAMPLE_SCHEMA));
    expect(errors).toHaveLength(2);

    await tool.setJson(badJson);

    await expect(tool.errorCountHeading).toHaveText("2 validation error(s)");
    await expect(tool.errorRows).toHaveCount(2);
  });

  test("невалидный JSON синтаксис — 'Parse error' с точным текстом ошибки браузера", async () => {
    const badJson = "{not json";
    const expectedMessage = await tool.page.evaluate((bad) => {
      try { JSON.parse(bad); return null; } catch (e) { return (e as Error).message; }
    }, badJson);

    await tool.setJson(badJson);

    await expect(tool.parseErrorHeading).toBeVisible();
    await expect(tool.parseErrorText).toHaveText(expectedMessage!);
  });
});
