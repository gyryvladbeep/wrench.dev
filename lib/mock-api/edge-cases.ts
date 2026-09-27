// ═══════════════════════════════════════════════════════════════
// Библиотека эдж-кейсов для Mock API — без AI
// ═══════════════════════════════════════════════════════════════
// Замена изначальной идеи I3 (LLM генерирует граничные значения) —
// денег на AI-бюджет пока нет, а эти значения QA-инженер и так знает
// наизусть. Статичный словарь, привязанный к типу поля, вставляется
// в текстовое поле ответа Mock API по клику — без обращения к любому
// внешнему сервису (см. EdgeCasePicker в components/mock-api/MockApiClient.tsx).
//
// value хранится как реальное JS-значение (не строка) — на месте
// вставки его сериализует JSON.stringify(), поэтому строка сама
// оборачивается в кавычки, а число/null/массив/объект — нет.

export interface EdgeCaseOption {
  id: string;
  labelRu: string;
  labelEn: string;
  value: unknown;
}

export interface EdgeCaseCategory {
  id: string;
  labelRu: string;
  labelEn: string;
  options: EdgeCaseOption[];
}

export const EDGE_CASE_LIBRARY: EdgeCaseCategory[] = [
  {
    id: "string",
    labelRu: "Строка",
    labelEn: "String",
    options: [
      { id: "empty", labelRu: "пустая строка", labelEn: "empty string", value: "" },
      { id: "whitespace", labelRu: "только пробелы", labelEn: "whitespace only", value: "   " },
      { id: "unicode", labelRu: "unicode / эмодзи", labelEn: "unicode / emoji", value: "héllo 世界 🚀" },
      { id: "long", labelRu: "очень длинная (10000 симв.)", labelEn: "very long (10000 chars)", value: "x".repeat(10000) },
      { id: "sql", labelRu: "SQL-инъекция", labelEn: "SQL injection", value: "' OR '1'='1'; DROP TABLE users;--" },
      { id: "xss", labelRu: "XSS-паттерн", labelEn: "XSS pattern", value: "<script>alert(1)</script>" },
    ],
  },
  {
    id: "number",
    labelRu: "Число",
    labelEn: "Number",
    options: [
      { id: "zero", labelRu: "0", labelEn: "0", value: 0 },
      { id: "negative", labelRu: "отрицательное", labelEn: "negative", value: -1 },
      { id: "float", labelRu: "дробное", labelEn: "fractional", value: 3.14159 },
      { id: "max-safe", labelRu: "MAX_SAFE_INTEGER", labelEn: "MAX_SAFE_INTEGER", value: Number.MAX_SAFE_INTEGER },
      { id: "min-safe", labelRu: "MIN_SAFE_INTEGER", labelEn: "MIN_SAFE_INTEGER", value: Number.MIN_SAFE_INTEGER },
      { id: "huge", labelRu: "очень большое (1e21)", labelEn: "very large (1e21)", value: 1e21 },
    ],
  },
  {
    id: "date",
    labelRu: "Дата",
    labelEn: "Date",
    options: [
      { id: "leap-day", labelRu: "високосный день", labelEn: "leap day", value: "2024-02-29T00:00:00Z" },
      { id: "past", labelRu: "далёкое прошлое", labelEn: "far past", value: "1970-01-01T00:00:00Z" },
      { id: "future", labelRu: "далёкое будущее", labelEn: "far future", value: "2099-12-31T23:59:59Z" },
      { id: "invalid", labelRu: "невалидная дата", labelEn: "invalid date", value: "not-a-date" },
    ],
  },
  {
    id: "boolean-null",
    labelRu: "Bool / null",
    labelEn: "Bool / null",
    options: [
      { id: "true", labelRu: "true", labelEn: "true", value: true },
      { id: "false", labelRu: "false", labelEn: "false", value: false },
      { id: "null", labelRu: "null", labelEn: "null", value: null },
    ],
  },
  {
    id: "structure",
    labelRu: "Массив / объект",
    labelEn: "Array / object",
    options: [
      { id: "empty-array", labelRu: "пустой массив", labelEn: "empty array", value: [] },
      { id: "empty-object", labelRu: "пустой объект", labelEn: "empty object", value: {} },
      { id: "nested-array", labelRu: "вложенный массив", labelEn: "nested array", value: [[1, 2], [3, 4]] },
    ],
  },
];
