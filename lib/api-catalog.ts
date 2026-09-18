import { Tool } from "./types";
import { siteConfig } from "./seo";
import { getImplementedTools, getToolBySlug } from "./tools-registry";

// ═══════════════════════════════════════════════════════════════
// Публичный, бесплатный, rate-limited API каталога инструментов
// (пункты 10+11 из ROADMAP-BRAINSTORM.md) — curl .../api/v1/tools/<slug>.
// /tools и /tools/{slug} отдают только МЕТАДАННЫЕ (название, описание,
// категория, ...) — сама логика каждого инструмента (форматирование
// JSON, декод JWT, ...) работает целиком в браузере пользователя (см.
// howItWorksBody в lib/i18n/dictionaries/*.ts) и не выполняется на
// сервере ни для кого. Выполнить эти же инструменты по-настоящему
// (а не только прочитать их метаданные) — отдельная история: локально,
// без сети, через CLI (cli/, пункт 9 — `wrench json format`, `wrench
// uuid` и т.д., та же логика, что уже переиспользована в
// vscode-extension/src/tools/*) или через VS Code-расширение (пункт 8).
//
// buildOpenApiSpec() и buildPostmanCollection() читают одни и те же
// исходники данных (listPublicTools()/getPublicToolDetail() для
// каталога), поэтому спек и коллекция не могут разойтись друг с другом
// по названиям/описаниям инструментов — это и есть смысл
// "автогенерируемая" из пункта 11. Пути write-эндпоинтов с личным
// токеном (/mock-endpoints, /webhook-bins, .../requests — пункт 13) и
// анонимного среза зарплат (/salary, /salary/report — пункт 23)
// описаны в buildOpenApiSpec()/buildPostmanCollection() вручную рядом
// с остальными путями: в отличие от каталога инструментов, у них нет
// отдельного динамического списка "все зарплатные эндпоинты", который
// стоило бы городить ради трёх записей.
// ═══════════════════════════════════════════════════════════════

export const API_VERSION = "v1";
export const API_BASE_PATH = `/api/${API_VERSION}`;

// 60 запросов в минуту с одного IP — щедро для честного использования
// (скрипт, curl, CI-шаг) и достаточно тесно, чтобы не дать залить
// бесплатный эндпоинт в тесном цикле. Число не привязано ни к какой
// платной инфраструктуре — просто разумная отправная точка, которую
// легко подвинуть в одном месте, если реальный трафик покажет иначе.
export const API_RATE_LIMIT = 60;
export const API_RATE_LIMIT_WINDOW_MS = 60_000;

export interface PublicToolSummary {
  slug:             string;
  name:             string;
  shortDescription: string;
  category:         string;
  keywords:         string[];
  url:              string;
}

export interface PublicToolDetail extends PublicToolSummary {
  longDescription: string;
  howToSteps:      string[];
  faqs:            { question: string; answer: string }[];
  relatedSlugs:    string[];
}

export function toPublicToolSummary(tool: Tool): PublicToolSummary {
  return {
    slug:             tool.slug,
    name:             tool.name,
    shortDescription: tool.shortDescription,
    category:         tool.category,
    keywords:         tool.keywords,
    url:              `${siteConfig.url}/tools/${tool.slug}`,
  };
}

export function toPublicToolDetail(tool: Tool): PublicToolDetail {
  return {
    ...toPublicToolSummary(tool),
    longDescription: tool.longDescription,
    howToSteps:      tool.howToSteps ?? [],
    faqs:            tool.faqs ?? [],
    relatedSlugs:    tool.relatedSlugs ?? [],
  };
}

// Только реализованные, не скрытые инструменты — getImplementedTools()
// уже строится поверх allTools (которое само исключает isHidden), то же
// самое множество, что даёт "82+" в футере (components/Footer.tsx).
// "Запланированные" (isImplemented: false) карточки — внутренняя
// заготовка контента, не то, что должно попадать во внешний публичный API.
export function listPublicTools(category?: string): PublicToolSummary[] {
  const tools = getImplementedTools();
  const filtered = category ? tools.filter((t) => t.category === category) : tools;
  return filtered.map(toPublicToolSummary);
}

export function getPublicToolDetail(slug: string): PublicToolDetail | null {
  const tool = getToolBySlug(slug);
  if (!tool || !tool.isImplemented) return null;
  return toPublicToolDetail(tool);
}

// ── OpenAPI 3.0 ──────────────────────────────────────────────────

export function buildOpenApiSpec() {
  const server = `${siteConfig.url}${API_BASE_PATH}`;
  return {
    openapi: "3.0.3",
    info: {
      title: `${siteConfig.name} Public API`,
      version: API_VERSION,
      description:
        "Free, rate-limited, read-only API for the Wrench-Branch tools catalog. " +
        "Metadata only — each tool's own logic runs client-side in the browser, " +
        "this API does not execute it server-side.",
      contact: { url: siteConfig.url },
    },
    servers: [{ url: server }],
    paths: {
      "/tools": {
        get: {
          summary: "List tools",
          description: "Returns every implemented, publicly listed tool. Optionally filter by category.",
          parameters: [
            {
              name: "category", in: "query", required: false,
              schema: { type: "string" },
              description: "Filter by category slug (e.g. formatting, encoding, qa, hash, generators).",
            },
          ],
          responses: {
            "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/ToolListResponse" } } } },
            "429": { description: "Rate limit exceeded", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/tools/{slug}": {
        get: {
          summary: "Get tool detail",
          description: "Returns full detail (long description, FAQs, related tools) for a single tool by its slug.",
          parameters: [
            { name: "slug", in: "path", required: true, schema: { type: "string" }, description: "Tool slug, e.g. json-formatter." },
          ],
          responses: {
            "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/ToolDetail" } } } },
            "404": { description: "Tool not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "429": { description: "Rate limit exceeded", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/salary": {
        get: {
          summary: "Get salary stats for one segment",
          description:
            "Aggregated, anonymized salary stats for one role (optionally narrowed by seniority/country). " +
            "Numeric fields are null when the segment has fewer than 3 responses.",
          parameters: [
            { name: "role", in: "query", required: true, schema: { type: "string" }, description: "Role tag, e.g. qa, frontend, backend." },
            { name: "seniority", in: "query", required: false, schema: { type: "string" }, description: "e.g. junior, middle, senior." },
            { name: "country", in: "query", required: false, schema: { type: "string" }, description: "e.g. am, ru, us." },
          ],
          responses: {
            "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/SalaryStats" } } } },
            "400": { description: "Invalid role/seniority/country", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "429": { description: "Rate limit exceeded", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/salary/report": {
        get: {
          summary: "Get the full salary market snapshot",
          description: "The same data behind /salary/report — every role×seniority and country breakdown in one call.",
          responses: {
            "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/SalaryReport" } } } },
            "429": { description: "Rate limit exceeded", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/mock-endpoints": {
        post: {
          summary: "Create or update a mock API endpoint",
          description:
            "Requires a personal API token (Profile -> Settings -> API tokens). Idempotent by `name`: reusing the " +
            "same name replaces that endpoint's routes instead of creating a new one, so repeated CI runs don't hit the free-tier limit.",
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/MockEndpointRequest" } } } },
          responses: {
            "200": { description: "Existing endpoint updated", content: { "application/json": { schema: { $ref: "#/components/schemas/MockEndpointResponse" } } } },
            "201": { description: "New endpoint created", content: { "application/json": { schema: { $ref: "#/components/schemas/MockEndpointResponse" } } } },
            "400": { description: "Invalid request body", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Missing or invalid token", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "403": { description: "Plan limit reached", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "429": { description: "Rate limit exceeded", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/webhook-bins": {
        post: {
          summary: "Create or reset a webhook bin",
          description:
            "Requires a personal API token. Idempotent by `name`: reusing the same name resets that bin's received " +
            "requests instead of creating a new one, so a fresh CI run doesn't see a previous run's webhooks.",
          security: [{ bearerAuth: [] }],
          requestBody: { required: false, content: { "application/json": { schema: { $ref: "#/components/schemas/WebhookBinRequest" } } } },
          responses: {
            "200": { description: "Existing bin reset", content: { "application/json": { schema: { $ref: "#/components/schemas/WebhookBinResponse" } } } },
            "201": { description: "New bin created", content: { "application/json": { schema: { $ref: "#/components/schemas/WebhookBinResponse" } } } },
            "401": { description: "Missing or invalid token", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "403": { description: "Plan limit reached", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "429": { description: "Rate limit exceeded", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/webhook-bins/{slug}/requests": {
        get: {
          summary: "List requests received by a webhook bin",
          description: "Requires the same personal API token used to create the bin; only its owner can read it.",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "slug", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/WebhookRequestsResponse" } } } },
            "401": { description: "Missing or invalid token", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Bin not found (or not owned by this token)", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "429": { description: "Rate limit exceeded", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http", scheme: "bearer",
          description: "Personal token (wrb_...) from Profile -> Settings -> API tokens, sent as `Authorization: Bearer <token>`.",
        },
      },
      schemas: {
        ToolSummary: {
          type: "object",
          properties: {
            slug:             { type: "string" },
            name:             { type: "string" },
            shortDescription: { type: "string" },
            category:         { type: "string" },
            keywords:         { type: "array", items: { type: "string" } },
            url:              { type: "string", format: "uri" },
          },
        },
        ToolListResponse: {
          type: "object",
          properties: {
            count: { type: "integer" },
            tools: { type: "array", items: { $ref: "#/components/schemas/ToolSummary" } },
          },
        },
        ToolDetail: {
          allOf: [
            { $ref: "#/components/schemas/ToolSummary" },
            {
              type: "object",
              properties: {
                longDescription: { type: "string" },
                howToSteps:      { type: "array", items: { type: "string" } },
                faqs:            { type: "array", items: { type: "object", properties: { question: { type: "string" }, answer: { type: "string" } } } },
                relatedSlugs:    { type: "array", items: { type: "string" } },
              },
            },
          ],
        },
        Error: {
          type: "object",
          properties: { error: { type: "string" } },
        },
        SalaryStatsCore: {
          type: "object",
          properties: {
            sample_size: { type: "integer" },
            median_usd:  { type: "number", nullable: true },
            avg_usd:     { type: "number", nullable: true },
            min_usd:     { type: "number", nullable: true },
            max_usd:     { type: "number", nullable: true },
          },
        },
        SalaryStats: {
          allOf: [
            { type: "object", properties: { role: { type: "string" }, seniority: { type: "string", nullable: true }, country: { type: "string", nullable: true } } },
            { $ref: "#/components/schemas/SalaryStatsCore" },
          ],
        },
        SalaryReport: {
          type: "object",
          properties: {
            totalCount: { type: "integer" },
            byRole: {
              type: "array",
              items: { allOf: [{ type: "object", properties: { role_tag: { type: "string" }, seniority: { type: "string" } } }, { $ref: "#/components/schemas/SalaryStatsCore" }] },
            },
            byCountry: {
              type: "array",
              items: { allOf: [{ type: "object", properties: { country: { type: "string" } } }, { $ref: "#/components/schemas/SalaryStatsCore" }] },
            },
          },
        },
        MockRoute: {
          type: "object",
          required: ["method", "path"],
          properties: {
            method:        { type: "string", enum: ["GET", "POST", "PUT", "PATCH", "DELETE"] },
            path:          { type: "string", description: "Must start with '/'." },
            status_code:   { type: "integer", default: 200 },
            response_body: { type: "string", default: "{}" },
            delay_ms:      { type: "integer", default: 0 },
          },
        },
        MockEndpointRequest: {
          type: "object",
          required: ["name", "routes"],
          properties: {
            name:   { type: "string", maxLength: 100 },
            routes: { type: "array", items: { $ref: "#/components/schemas/MockRoute" } },
          },
        },
        MockEndpointResponse: {
          type: "object",
          properties: {
            id:   { type: "string" },
            slug: { type: "string" },
            name: { type: "string" },
            url:  { type: "string", format: "uri" },
            routes: { type: "array", items: { allOf: [{ $ref: "#/components/schemas/MockRoute" }, { type: "object", properties: { url: { type: "string", format: "uri" } } }] } },
          },
        },
        WebhookBinRequest: {
          type: "object",
          properties: { name: { type: "string", maxLength: 100, default: "CI run" } },
        },
        WebhookBinResponse: {
          type: "object",
          properties: {
            id:  { type: "string" },
            slug: { type: "string" },
            name: { type: "string" },
            url:  { type: "string", format: "uri" },
            requestsUrl: { type: "string", format: "uri" },
          },
        },
        WebhookRequestEntry: {
          type: "object",
          properties: {
            id: { type: "string" }, method: { type: "string" }, path: { type: "string" },
            query: { type: "object" }, headers: { type: "object" }, body: { type: "string" },
            content_type: { type: "string", nullable: true }, source_ip: { type: "string", nullable: true },
            received_at: { type: "string", format: "date-time" },
          },
        },
        WebhookRequestsResponse: {
          type: "object",
          properties: {
            count: { type: "integer" },
            requests: { type: "array", items: { $ref: "#/components/schemas/WebhookRequestEntry" } },
          },
        },
      },
    },
  };
}

// ── Postman-коллекция ────────────────────────────────────────────
// Тот же формат URL-объекта, что Postman сам пишет при экспорте — host
// разбит по точкам, path по слэшам, query — отдельным массивом. Строим
// его один раз через postmanUrl(), а не переписываем вручную под каждый
// запрос — правки одного эндпоинта не могут разойтись с остальными.

function postmanUrl(rawUrl: string) {
  const u = new URL(rawUrl);
  return {
    raw:      rawUrl,
    protocol: u.protocol.replace(":", ""),
    host:     u.hostname.split("."),
    path:     u.pathname.split("/").filter(Boolean),
    ...(u.search ? { query: Array.from(u.searchParams.entries()).map(([key, value]) => ({ key, value })) } : {}),
  };
}

// Bearer-заголовок для трёх запросов, которым нужен личный токен —
// сам токен подставляется переменной коллекции wrench_api_token (см.
// variable ниже), а не хардкодится, чтобы коллекцию можно было
// импортировать и сразу заполнить своим токеном в Postman, не редактируя
// каждый запрос по отдельности.
const AUTH_HEADER = [{ key: "Authorization", value: "Bearer {{wrench_api_token}}" }];

export function buildPostmanCollection() {
  const base = `${siteConfig.url}${API_BASE_PATH}`;
  return {
    info: {
      name: `${siteConfig.name} Public API`,
      description:
        "Auto-generated from the same route definitions as /api/v1/openapi.json — see that spec for full schemas. " +
        "GET requests are free, rate-limited (60 req/min per IP), no auth required. The three POST/write requests " +
        "need a personal token (Profile -> Settings -> API tokens on the site) — set it once as this collection's " +
        "wrench_api_token variable.",
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    variable: [{ key: "wrench_api_token", value: "wrb_your_token_here" }],
    item: [
      {
        name: "List tools",
        request: { method: "GET", header: [], url: postmanUrl(`${base}/tools`) },
      },
      {
        name: "List tools by category",
        request: { method: "GET", header: [], url: postmanUrl(`${base}/tools?category=formatting`) },
      },
      {
        name: "Get tool detail",
        request: { method: "GET", header: [], url: postmanUrl(`${base}/tools/json-formatter`) },
      },
      {
        name: "Get salary stats for one segment",
        request: { method: "GET", header: [], url: postmanUrl(`${base}/salary?role=qa&seniority=senior`) },
      },
      {
        name: "Get full salary market snapshot",
        request: { method: "GET", header: [], url: postmanUrl(`${base}/salary/report`) },
      },
      {
        name: "Create or update a mock endpoint",
        request: {
          method: "POST",
          header: [...AUTH_HEADER, { key: "Content-Type", value: "application/json" }],
          body: {
            mode: "raw",
            raw: JSON.stringify(
              { name: "Example mock", routes: [{ method: "GET", path: "/users/1", status_code: 200, response_body: "{\"id\":1}" }] },
              null, 2
            ),
          },
          url: postmanUrl(`${base}/mock-endpoints`),
        },
      },
      {
        name: "Create or reset a webhook bin",
        request: {
          method: "POST",
          header: [...AUTH_HEADER, { key: "Content-Type", value: "application/json" }],
          body: { mode: "raw", raw: JSON.stringify({ name: "CI run" }, null, 2) },
          url: postmanUrl(`${base}/webhook-bins`),
        },
      },
      {
        name: "List requests received by a webhook bin",
        request: { method: "GET", header: AUTH_HEADER, url: postmanUrl(`${base}/webhook-bins/your-bin-slug/requests`) },
      },
    ],
  };
}
