import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { parseCollectionFile, MAX_PARSED_ROUTES } from "@/lib/mock-api/parse-collection";

// ═══════════════════════════════════════════════════════════════
// Почему этот файл не открывает браузер
// ═══════════════════════════════════════════════════════════════
// parseCollectionFile() — чистая функция (JSON.parse + обход объекта,
// без DOM/fetch), так что нет смысла гонять её через реальную страницу
// и загрузку файла в <input type="file"> — это было бы медленнее и не
// проверяло бы ничего сверх самой логики разбора. Отдельный e2e-тест
// на сам модал импорта (выбор файла → превью → сохранение маршрутов)
// требует настоящего Supabase-аккаунта и живёт в
// tests/mock-api-import.spec.ts вместе с остальными auth-тестами.
//
// Каждый test() ниже — обычный Node-код без фикстуры {page}: Playwright
// это поддерживает и запускает такой тест без браузера вовсе.

const FIXTURES = path.join(__dirname, "fixtures", "mock-api");
const postmanJson = fs.readFileSync(path.join(FIXTURES, "postman-collection.json"), "utf-8");
const insomniaJson = fs.readFileSync(path.join(FIXTURES, "insomnia-export.json"), "utf-8");

test.describe("parseCollectionFile — Postman", () => {
  test("распознаёт формат и имя коллекции", () => {
    const result = parseCollectionFile(postmanJson);
    expect(result.ok).toBe(true);
    expect(result.format).toBe("postman");
    expect(result.collectionName).toBe("Orders API");
    expect(result.formatSupportsExamples).toBe(true);
  });

  test("вложенная папка обходится, поддерживаемые методы попадают в routes", () => {
    const result = parseCollectionFile(postmanJson);
    // Ping, Create order, Get order by id — три поддерживаемых метода;
    // Preflight (OPTIONS) уходит в skipped, а не в routes.
    expect(result.routes).toHaveLength(3);
  });

  test("для запроса с response-примером путь и тело берутся из originalRequest примера (200), а не из шаблона запроса", () => {
    const result = parseCollectionFile(postmanJson);
    const route = result.routes.find((r) => r.sourceName === "Get order by id");
    expect(route).toBeTruthy();
    expect(route!.method).toBe("GET");
    // originalRequest.url.path = ["orders", "42"] — конкретное значение
    // из примера, а не ":id" из шаблона запроса.
    expect(route!.path).toBe("/orders/42");
    expect(route!.status_code).toBe(200); // предпочли 2xx-пример перед 404
    expect(route!.hasExample).toBe(true);
    expect(JSON.parse(route!.response_body)).toEqual({ id: 42, status: "shipped" });
  });

  test("запрос без примеров получает путь из url.path запроса, дефолтные статус/тело, hasExample=false", () => {
    const result = parseCollectionFile(postmanJson);
    const route = result.routes.find((r) => r.sourceName === "Create order");
    expect(route).toBeTruthy();
    expect(route!.method).toBe("POST");
    expect(route!.path).toBe("/orders");
    expect(route!.status_code).toBe(200);
    expect(route!.hasExample).toBe(false);
    expect(() => JSON.parse(route!.response_body)).not.toThrow();
  });

  test("request в виде голой строки (shorthand) парсится как GET, host обрезается до пути", () => {
    const result = parseCollectionFile(postmanJson);
    const route = result.routes.find((r) => r.sourceName === "Ping");
    expect(route).toBeTruthy();
    expect(route!.method).toBe("GET");
    expect(route!.path).toBe("/ping");
  });

  test("неподдерживаемый метод (OPTIONS) не попадает в routes, а помечается как skipped", () => {
    const result = parseCollectionFile(postmanJson);
    expect(result.routes.some((r) => r.sourceName === "Preflight")).toBe(false);
    expect(result.skipped).toEqual([
      { method: "OPTIONS", path: "/orders", sourceName: "Preflight", reason: "unsupported-method" },
    ]);
  });
});

test.describe("parseCollectionFile — Insomnia", () => {
  test("распознаёт формат и имя рабочего пространства", () => {
    const result = parseCollectionFile(insomniaJson);
    expect(result.ok).toBe(true);
    expect(result.format).toBe("insomnia");
    expect(result.collectionName).toBe("Orders Workspace");
    // У Insomnia-экспорта нет сохранённых тел ответа — UI должен
    // показать отдельное предупреждение на основе этого флага.
    expect(result.formatSupportsExamples).toBe(false);
  });

  test("папки (request_group) пропускаются, шаблонные {{ _.var }} превращаются в читаемый {var}", () => {
    const result = parseCollectionFile(insomniaJson);
    expect(result.routes).toHaveLength(2); // Trace (TRACE) не поддерживается
    const getOrder = result.routes.find((r) => r.sourceName === "Get order");
    expect(getOrder).toBeTruthy();
    expect(getOrder!.method).toBe("GET");
    expect(getOrder!.path).toBe("/orders/{id}");
    expect(getOrder!.hasExample).toBe(false);
    expect(getOrder!.status_code).toBe(200);
  });

  test("литеральный путь без шаблонов остаётся как есть", () => {
    const result = parseCollectionFile(insomniaJson);
    const del = result.routes.find((r) => r.sourceName === "Delete order");
    expect(del).toBeTruthy();
    expect(del!.method).toBe("DELETE");
    expect(del!.path).toBe("/orders/42");
  });

  test("неподдерживаемый метод (TRACE) уходит в skipped", () => {
    const result = parseCollectionFile(insomniaJson);
    expect(result.skipped).toEqual([
      { method: "TRACE", path: "/orders", sourceName: "Trace", reason: "unsupported-method" },
    ]);
  });
});

test.describe("parseCollectionFile — граничные случаи", () => {
  test("пустая строка -> error 'empty'", () => {
    const result = parseCollectionFile("");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("empty");
    expect(result.routes).toEqual([]);
  });

  test("невалидный JSON -> error 'invalid-json'", () => {
    const result = parseCollectionFile("{ this is not json");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("invalid-json");
  });

  test("валидный JSON, но не Postman и не Insomnia -> error 'unrecognized-format'", () => {
    const result = parseCollectionFile(JSON.stringify({ hello: "world" }));
    expect(result.ok).toBe(false);
    expect(result.error).toBe("unrecognized-format");
  });

  test("огромная коллекция обрезается по MAX_PARSED_ROUTES и помечается truncated", () => {
    const items = Array.from({ length: MAX_PARSED_ROUTES + 25 }, (_, i) => ({
      name: `Route ${i}`,
      request: { method: "GET", url: { raw: `{{baseUrl}}/r/${i}`, path: ["r", String(i)] } },
    }));
    const huge = JSON.stringify({ info: { name: "Huge" }, item: items });
    const result = parseCollectionFile(huge);
    expect(result.ok).toBe(true);
    expect(result.routes).toHaveLength(MAX_PARSED_ROUTES);
    expect(result.truncated).toBe(true);
  });

  test("не-JSON тело примера заворачивается в валидную JSON-строку, а не ломает сохранение", () => {
    const collection = JSON.stringify({
      info: { name: "Text body" },
      item: [
        {
          name: "Plain text response",
          request: { method: "GET", url: { raw: "{{baseUrl}}/health", path: ["health"] } },
          response: [{ code: 200, body: "OK" }],
        },
      ],
    });
    const result = parseCollectionFile(collection);
    const route = result.routes[0];
    expect(() => JSON.parse(route.response_body)).not.toThrow();
    expect(JSON.parse(route.response_body)).toBe("OK");
  });
});
