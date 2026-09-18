import { Tool } from "./types";
import { siteConfig } from "./seo";
import { getImplementedTools, getToolBySlug } from "./tools-registry";

// ═══════════════════════════════════════════════════════════════
// Публичный, бесплатный, rate-limited API каталога инструментов
// (пункты 10+11 из ROADMAP-BRAINSTORM.md) — curl .../api/v1/tools/<slug>.
// Отдаёт только МЕТАДАННЫЕ (название, описание, категория, ...) — сама
// логика каждого инструмента (форматирование JSON, декод JWT, ...)
// работает целиком в браузере пользователя (см. howItWorksBody в
// lib/i18n/dictionaries/*.ts) и не выполняется на сервере ни для кого,
// это НЕ API для "выполнить форматирование JSON по HTTP" — та идея
// (CLI, `npx wrench <tool> <input>`) отдельная и намеренно отложена
// (пункт 9 в роадмапе).
//
// buildOpenApiSpec() и buildPostmanCollection() читают отсюда одни и те
// же PUBLIC_ROUTES — единственный источник правды для обоих документов,
// это и есть смысл "автогенерируемая" из пункта 11: спек и коллекция
// не могут разъехаться друг с другом, потому что оба считаются из одного
// массива, а не переписаны вручную дважды.
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
    },
    components: {
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

export function buildPostmanCollection() {
  const base = `${siteConfig.url}${API_BASE_PATH}`;
  return {
    info: {
      name: `${siteConfig.name} Public API`,
      description:
        "Auto-generated from the same route definitions as /api/v1/openapi.json — see that spec for full schemas. " +
        "Free, rate-limited (60 req/min per IP), no auth required.",
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
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
    ],
  };
}
