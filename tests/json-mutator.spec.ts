import { test, expect } from "@playwright/test";
import { JsonMutatorPage } from "./pages/JsonMutatorPage";

// Точная копия типов/хелперов/getMutations() из components/tools/JsonMutatorTool.tsx —
// нужна, чтобы посчитать ожидаемое число мутаций и их содержимое так же,
// как считает сама страница, а не гадать вручную.
type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };
interface FieldPath { path: string[]; type: string; value: JsonValue; }
interface Mutation  { label: string; labelRu: string; value: JsonValue; category: string; }

function detectType(val: JsonValue): string {
  if (val === null)           return "null";
  if (Array.isArray(val))     return "array";
  if (typeof val === "object") return "object";
  return typeof val;
}

function flattenPaths(obj: JsonValue, prefix: string[] = []): FieldPath[] {
  if (typeof obj !== "object" || obj === null) return [];
  const result: FieldPath[] = [];
  const entries = Array.isArray(obj)
    ? obj.map((v, i) => [`${i}`, v] as [string, JsonValue])
    : Object.entries(obj as Record<string, JsonValue>);
  for (const [key, val] of entries) {
    const path = [...prefix, key];
    result.push({ path, type: detectType(val), value: val });
    if (typeof val === "object" && val !== null) result.push(...flattenPaths(val, path));
  }
  return result;
}

function setPath(obj: JsonValue, path: string[], value: JsonValue): JsonValue {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  if (Array.isArray(obj)) {
    const idx = parseInt(head);
    const arr = [...obj];
    arr[idx] = setPath(arr[idx], rest, value);
    return arr;
  }
  const o = { ...(obj as Record<string, JsonValue>) };
  o[head] = setPath(o[head], rest, value);
  return o;
}

function getMutations(type: string): Mutation[] {
  const shared: Mutation[] = [
    { label:"null",                    labelRu:"null",                     value:null,             category:"type" },
    { label:"Empty string",            labelRu:"Пустая строка",            value:"",               category:"type" },
    { label:"Number (0)",              labelRu:"Число (0)",                value:0,                category:"type" },
    { label:"Boolean true",            labelRu:"Булево true",              value:true,             category:"type" },
    { label:"Boolean false",           labelRu:"Булево false",             value:false,            category:"type" },
    { label:"Empty array",             labelRu:"Пустой массив",            value:[],               category:"type" },
    { label:"Empty object",            labelRu:"Пустой объект",            value:{},               category:"type" },
    { label:'String "null"',           labelRu:'Строка "null"',            value:"null",           category:"type" },
    { label:'String "undefined"',      labelRu:'Строка "undefined"',       value:"undefined",      category:"type" },
    { label:'String "true"',           labelRu:'Строка "true"',            value:"true",           category:"type" },
  ];
  const byType: Record<string, Mutation[]> = {
    string: [
      { label:"Whitespace only",         labelRu:"Только пробелы",          value:"   ",            category:"boundary" },
      { label:"Very long string (1000)", labelRu:"Очень длинная (1000)",    value:"a".repeat(1000), category:"boundary" },
      { label:"Unicode chars",           labelRu:"Unicode символы",         value:"áéíóú ñ 中文 🎉",  category:"boundary" },
      { label:"Special chars",           labelRu:"Спецсимволы",             value:"!@#$%^&*()_+-=", category:"boundary" },
      { label:"SQL injection",           labelRu:"SQL инъекция",            value:"' OR 1=1 --",   category:"injection" },
      { label:"XSS payload",             labelRu:"XSS нагрузка",            value:'<script>alert(1)</script>', category:"injection" },
      { label:"Path traversal",          labelRu:"Path traversal",          value:"../../etc/passwd", category:"injection" },
      { label:"CRLF injection",          labelRu:"CRLF инъекция",           value:"value\r\nHeader: injected", category:"injection" },
      { label:"Format string",           labelRu:"Format string",           value:"%s%s%s%s%s",    category:"injection" },
      { label:"Zero-width chars",        labelRu:"Невидимые символы",       value:"val" + String.fromCharCode(0x200B) + "ue", category:"boundary" },
    ],
    number: [
      { label:"Negative (-1)",           labelRu:"Отрицательное (-1)",      value:-1,               category:"boundary" },
      { label:"Zero (0)",                labelRu:"Ноль (0)",                value:0,                category:"boundary" },
      { label:"Max safe integer",        labelRu:"Макс. safe integer",      value:Number.MAX_SAFE_INTEGER, category:"boundary" },
      { label:"Min safe integer",        labelRu:"Мин. safe integer",       value:Number.MIN_SAFE_INTEGER, category:"boundary" },
      { label:"Float (1.5)",             labelRu:"Дробное (1.5)",           value:1.5,              category:"boundary" },
      { label:"Infinity as string",      labelRu:"Infinity строкой",        value:"Infinity",       category:"boundary" },
      { label:"NaN as string",           labelRu:"NaN строкой",             value:"NaN",            category:"boundary" },
      { label:"Numeric string",          labelRu:"Число строкой",           value:"123",            category:"type" },
      { label:"Negative float",          labelRu:"Отрицательное дробное",   value:-0.001,           category:"boundary" },
      { label:"Very large number",       labelRu:"Очень большое число",     value:999999999999,     category:"boundary" },
    ],
    boolean: [
      { label:'String "false"',          labelRu:'Строка "false"',          value:"false",          category:"type" },
      { label:'String "0"',              labelRu:'Строка "0"',              value:"0",              category:"type" },
      { label:"Number 0",                labelRu:"Число 0",                 value:0,                category:"type" },
      { label:"Number 1",                labelRu:"Число 1",                 value:1,                category:"type" },
    ],
    array: [
      { label:"Single null item",        labelRu:"Один null элемент",       value:[null],           category:"boundary" },
      { label:"Very large array (100)",  labelRu:"Большой массив (100)",    value:Array(100).fill("item"), category:"boundary" },
      { label:"Mixed types",             labelRu:"Разные типы",             value:[1,"two",true,null,{}], category:"type" },
      { label:"Nested array",            labelRu:"Вложенный массив",        value:[[1,2],[3,4]],    category:"type" },
    ],
    object: [
      { label:"Extra unknown field",     labelRu:"Лишнее поле",             value:{ unknown_field:"evil" }, category:"boundary" },
      { label:"Deeply nested",           labelRu:"Глубокая вложенность",    value:{ a:{ b:{ c:{ d:"deep" } } } }, category:"boundary" },
    ],
  };
  const extra = byType[type] ?? [];
  return [...shared, ...extra];
}

const SAMPLE = `{
  "username": "alice",
  "age": 25,
  "active": true,
  "role": "admin",
  "tags": ["qa", "dev"],
  "address": {
    "city": "Yerevan",
    "zip": "0001"
  }
}`;
const PARSED_SAMPLE = JSON.parse(SAMPLE);

function mutate(rootData: JsonValue, path: string[], value: JsonValue): string {
  return JSON.stringify(setPath(rootData, path, value), null, 2);
}

test.describe("JSON Mutator", () => {
  let tool: JsonMutatorPage;

  test.beforeEach(async ({ page }) => {
    tool = new JsonMutatorPage(page);
    await tool.goto();
  });

  test("дефолтный SAMPLE даёт ровно 10 полей (примитивы + tags.0/1 + address.city/zip)", async () => {
    const fields = flattenPaths(PARSED_SAMPLE);
    expect(fields).toHaveLength(10);

    await expect(tool.fieldsBadge).toHaveText(`Valid JSON · ${fields.length} fields`);
  });

  test("выбор строкового поля 'username' — 20 мутаций (10 shared + 5 boundary + 5 injection)", async () => {
    await tool.selectField("username");
    const mutations = getMutations("string");
    expect(mutations).toHaveLength(20);

    await expect(tool.mutationsCount).toHaveText("20 mutations");
  });

  test("фильтр 'Injection' для строкового поля — 5 мутаций, содержимое SQL injection карточки совпадает с mutate()", async () => {
    await tool.selectField("username");
    const injectionCount = getMutations("string").filter((m) => m.category === "injection").length;
    expect(injectionCount).toBe(5);

    await tool.setCategory("Injection", injectionCount);

    const sqlMutation = getMutations("string").find((m) => m.label === "SQL injection")!;
    const expectedBody = mutate(PARSED_SAMPLE, ["username"], sqlMutation.value);
    await expect(tool.mutationCardPre("SQL injection")).toHaveText(expectedBody);
  });

  test("числовое поле 'age' — фильтр 'Boundary' даёт 9 мутаций (у number нет injection)", async () => {
    await tool.selectField("age");
    const boundaryCount = getMutations("number").filter((m) => m.category === "boundary").length;
    expect(boundaryCount).toBe(9);

    await tool.setCategory("Boundary", boundaryCount);
    await expect(tool.mutationsCount).toHaveText("9 mutations");
  });

  test("объектное поле 'address' — 0 мутаций категории 'Injection'", async () => {
    await tool.selectField("address");
    const injectionCount = getMutations("object").filter((m) => m.category === "injection").length;
    expect(injectionCount).toBe(0);

    await tool.setCategory("Injection", injectionCount);
    await expect(tool.mutationsCount).toHaveText("0 mutations");
  });

  test("режим 'All at once' — карточка #1 содержит корректно мутированный JSON", async () => {
    await tool.selectField("active");
    await tool.setCategory("Types", getMutations("boolean").length);
    await tool.modeButton("All at once").click();

    const firstMutation = getMutations("boolean")[0]; // "null"
    const expectedBody = mutate(PARSED_SAMPLE, ["active"], firstMutation.value);
    await expect(tool.mutationCardPre("null")).toHaveText(expectedBody);
  });

  test("невалидный JSON — показывается точный текст ошибки браузера, список полей скрыт", async () => {
    const badJson = '{"broken":';
    const expectedMessage = await tool.page.evaluate((bad) => {
      try { JSON.parse(bad); return null; } catch (e) { return (e as Error).message; }
    }, badJson);

    await tool.setInput(badJson);

    await expect(tool.parseError).toHaveText(expectedMessage!);
    await expect(tool.fieldsBadge).toBeHidden();
  });

  test("до выбора поля показывается подсказка 'Select a field on the left'", async () => {
    await expect(tool.emptySelectionHint).toBeVisible();
  });
});
