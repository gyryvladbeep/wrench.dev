// ═══════════════════════════════════════════════════════════════
// Импорт коллекций Postman / Insomnia в Mock API
// ═══════════════════════════════════════════════════════════════
// Почему это вообще нужно: без импорта завести мок вручную — это
// пересоздать каждый route по одному (метод, путь, статус, тело) через
// форму в MockApiClient. На 1-2 маршрута это нормально, но у любого
// реального проекта их 20-50, и никто не будет тратить полчаса на
// ручной ввод ради того, чтобы попробовать инструмент.
//
// А у любого QA/дева уже лежит на диске коллекция Postman или
// Insomnia под его текущий рабочий проект — это не гипотетический
// пример из документации, а то, с чем он и так работает каждый день.
// Перетащил файл — через 10 секунд получил живые мок-эндпоинты.
//
// Важная честная оговорка (см. ImportCollectionModal.tsx): полностью
// рабочим "из коробки" импорт получается только если в коллекции
// СОХРАНЕНЫ примеры ответов (Postman: response examples). Без них
// маршруты всё равно импортируются (метод+путь), но с
// плейсхолдер-телом, которое нужно будет донаполнить руками — это
// уже "удобно", а не "вау". Поле hasExample на каждом ParsedRoute
// существует именно чтобы UI мог честно это показать.
//
// Этот модуль — чистые функции, без DOM/React/fetch: даёт возможность
// протестировать логику разбора напрямую (см.
// tests/mock-api-collection-parser.spec.ts) без браузера и без
// поднятого dev-сервера.

export const SUPPORTED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
export type SupportedMethod = (typeof SUPPORTED_METHODS)[number];

// Тот же самый потолок, что у нагрузочного теста в MockApiClient
// (MAX_REQUESTS) — не про лимиты free/Pro (те применяются позже, при
// реальном сохранении в lib/hooks/useMockEndpoints.ts), а просто
// защита браузера от разбора патологически огромного файла.
export const MAX_PARSED_ROUTES = 200;

export interface ParsedRoute {
  method: SupportedMethod;
  path: string;
  status_code: number;
  response_body: string;
  delay_ms: number;
  hasExample: boolean;
  sourceName: string;
}

export interface SkippedRoute {
  method: string;
  path: string;
  sourceName: string;
  reason: "unsupported-method";
}

export type CollectionFormat = "postman" | "insomnia";

export type ParseError =
  | "invalid-json"
  | "empty"
  | "unrecognized-format";

export interface ParseResult {
  ok: boolean;
  error: ParseError | null;
  format: CollectionFormat | null;
  collectionName: string;
  routes: ParsedRoute[];
  skipped: SkippedRoute[];
  truncated: boolean;
  // Insomnia-экспорты по умолчанию не несут сохранённых примеров
  // ответа (в отличие от Postman) — UI показывает отдельное
  // предупреждение об этом один раз на весь файл, а не на каждый route.
  formatSupportsExamples: boolean;
}

// Совпадает с normalizePath() из components/mock-api/MockApiClient.tsx —
// намеренно отдельная копия здесь: этот модуль не тянет за собой
// компонент, а логика достаточно маленькая, чтобы дублирование было
// дешевле, чем связывать два файла общим импортом ради одной функции.
function normalizeMockPath(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "/";
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (withSlash === "/") return "/";
  return withSlash.replace(/\/+$/, "") || "/";
}

function isSupportedMethod(method: string): method is SupportedMethod {
  return (SUPPORTED_METHODS as readonly string[]).includes(method);
}

// Тело примера сохраняется как есть, если это уже валидный JSON —
// именно так mock-сервер (app/api/mock/[slug]/[[...path]]/route.ts) и
// форма ручного ввода (MockApiClient) трактуют response_body. Если
// пример из коллекции не JSON (обычный текст, HTML, пусто) — заворачиваем
// его в JSON-строку, чтобы поле осталось валидным JSON и ничего не
// падало при сохранении/выдаче.
function toStoredBody(raw: string): string {
  const text = raw ?? "";
  try {
    JSON.parse(text);
    return text;
  } catch {
    return JSON.stringify(text.length > 0 ? text : "");
  }
}

const DEFAULT_BODY = JSON.stringify({ message: "mocked response" }, null, 2);

function emptyResult(error: ParseError): ParseResult {
  return {
    ok: false,
    error,
    format: null,
    collectionName: "",
    routes: [],
    skipped: [],
    truncated: false,
    formatSupportsExamples: false,
  };
}

export function parseCollectionFile(rawText: string): ParseResult {
  if (!rawText || !rawText.trim()) return emptyResult("empty");

  let data: unknown;
  try {
    data = JSON.parse(rawText);
  } catch {
    return emptyResult("invalid-json");
  }

  if (!data || typeof data !== "object") return emptyResult("unrecognized-format");

  if (isPostmanCollection(data)) return parsePostman(data as PostmanCollection);
  if (isInsomniaExport(data)) return parseInsomnia(data as InsomniaExport);

  return emptyResult("unrecognized-format");
}

// ═══════════════════════════════════════════════════════
// Postman Collection v2.0 / v2.1
// ═══════════════════════════════════════════════════════

interface PostmanUrlVariable { key?: string; value?: string; }
interface PostmanUrl {
  raw?: string;
  path?: Array<string | { value?: string }>;
  variable?: PostmanUrlVariable[];
}
interface PostmanRequest {
  method?: string;
  url?: string | PostmanUrl;
}
interface PostmanResponseExample {
  code?: number;
  body?: string;
  originalRequest?: { url?: string | PostmanUrl };
}
interface PostmanItem {
  name?: string;
  item?: PostmanItem[];
  request?: string | PostmanRequest;
  response?: PostmanResponseExample[];
}
interface PostmanCollection {
  info?: { name?: string; schema?: string };
  item?: PostmanItem[];
}

function isPostmanCollection(data: unknown): data is PostmanCollection {
  const d = data as PostmanCollection;
  return Array.isArray(d.item);
}

function resolvePostmanUrl(url: string | PostmanUrl | undefined): string {
  if (!url) return "/";
  if (typeof url === "string") return stripUrlToPath(url);
  if (Array.isArray(url.path) && url.path.length > 0) {
    const variables = new Map((url.variable ?? []).map((v) => [v.key ?? "", v.value ?? ""]));
    const segments = url.path.map((seg) => {
      const value = typeof seg === "string" ? seg : (seg?.value ?? "");
      // Path-переменная вида ":id" — если в url.variable есть конкретное
      // значение под этим именем, подставляем его (тогда путь получается
      // литеральным и реально совпадёт с вызовом), иначе оставляем как
      // есть — mock-сервер матчит путь строго строкой, так что ":id"
      // так и останется частью пути, который нужно будет вызывать буквально.
      if (value.startsWith(":")) {
        const resolved = variables.get(value.slice(1));
        return resolved && resolved.length > 0 ? resolved : value;
      }
      return value;
    });
    return normalizeMockPath(segments.join("/"));
  }
  if (typeof url.raw === "string") return stripUrlToPath(url.raw);
  return "/";
}

// "{{baseUrl}}/orders/42?x=1" → "/orders/42" — отрезаем ведущие
// {{...}}-переменные (хост коллекции) и всё после первого "/",
// убираем query/hash. Если после host-переменной "/" нет вовсе
// (голый "{{baseUrl}}"), считаем путём корень.
function stripUrlToPath(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^\{\{[^}]*\}\}/, "");
  s = s.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^/]*/, ""); // абсолютный URL с реальным хостом
  const qIndex = s.search(/[?#]/);
  if (qIndex >= 0) s = s.slice(0, qIndex);
  return normalizeMockPath(s || "/");
}

function pickPostmanExample(responses: PostmanResponseExample[] | undefined): PostmanResponseExample | null {
  if (!Array.isArray(responses) || responses.length === 0) return null;
  const success = responses.find((r) => typeof r.code === "number" && r.code >= 200 && r.code < 300);
  return success ?? responses[0];
}

function parsePostman(data: PostmanCollection): ParseResult {
  const routes: ParsedRoute[] = [];
  const skipped: SkippedRoute[] = [];
  let truncated = false;

  function walk(items: PostmanItem[]) {
    for (const item of items) {
      if (truncated) return;
      if (Array.isArray(item.item)) {
        walk(item.item);
        continue;
      }
      if (!item.request) continue;

      const request: PostmanRequest = typeof item.request === "string" ? { method: "GET", url: item.request } : item.request;
      const method = (request.method ?? "GET").toUpperCase();
      const sourceName = item.name || "Request";

      if (!isSupportedMethod(method)) {
        skipped.push({ method, path: resolvePostmanUrl(request.url), sourceName, reason: "unsupported-method" });
        continue;
      }

      const example = pickPostmanExample(item.response);
      const path = example?.originalRequest?.url
        ? resolvePostmanUrl(example.originalRequest.url)
        : resolvePostmanUrl(request.url);

      if (routes.length >= MAX_PARSED_ROUTES) { truncated = true; return; }

      routes.push({
        method,
        path,
        status_code: typeof example?.code === "number" ? example.code : 200,
        response_body: example ? toStoredBody(example.body ?? "") : DEFAULT_BODY,
        delay_ms: 0,
        hasExample: !!example,
        sourceName,
      });
    }
  }

  walk(data.item ?? []);

  return {
    ok: true,
    error: null,
    format: "postman",
    collectionName: data.info?.name || "Imported collection",
    routes,
    skipped,
    truncated,
    formatSupportsExamples: true,
  };
}

// ═══════════════════════════════════════════════════════
// Insomnia export (v4 JSON: { _type: "export", resources: [...] })
// ═══════════════════════════════════════════════════════
// Стандартный экспорт запросов Insomnia не несёт сохранённых тел
// ответа (в отличие от Postman response examples) — поэтому здесь
// hasExample всегда false, и UI отдельно предупреждает об этом один
// раз на файл, а не на каждый маршрут.

interface InsomniaResource {
  _type?: string;
  _id?: string;
  name?: string;
  method?: string;
  url?: string;
}
interface InsomniaExport {
  _type?: string;
  resources?: InsomniaResource[];
}

function isInsomniaExport(data: unknown): data is InsomniaExport {
  const d = data as InsomniaExport;
  return d._type === "export" && Array.isArray(d.resources);
}

// "{{ _.base_url }}/orders/{{ _.id }}" → "/orders/{id}" — Insomnia
// шаблонизирует Nunjucks-style тегами {{ _.имя }} (или просто
// {{ имя }} в старых версиях). Ведущий тег хоста отрезаем целиком (как
// {{baseUrl}} у Postman), а теги ВНУТРИ пути заменяем на читаемый
// плейсхолдер "{имя}" вместо того чтобы оставлять фигурные скобки
// Nunjucks буквально в пути.
function stripInsomniaUrlToPath(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^\{\{[^}]*\}\}/, "");
  s = s.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^/]*/, "");
  const qIndex = s.search(/[?#]/);
  if (qIndex >= 0) s = s.slice(0, qIndex);
  s = s.replace(/\{\{\s*_?\.?([a-zA-Z0-9_]+)\s*\}\}/g, (_m, name: string) => `{${name}}`);
  return normalizeMockPath(s || "/");
}

function parseInsomnia(data: InsomniaExport): ParseResult {
  const routes: ParsedRoute[] = [];
  const skipped: SkippedRoute[] = [];
  let truncated = false;

  const workspace = (data.resources ?? []).find((r) => r._type === "workspace");
  const requests = (data.resources ?? []).filter((r) => r._type === "request");

  for (const req of requests) {
    if (routes.length >= MAX_PARSED_ROUTES) { truncated = true; break; }
    const method = (req.method ?? "GET").toUpperCase();
    const sourceName = req.name || req.url || "Request";
    const path = stripInsomniaUrlToPath(req.url ?? "/");

    if (!isSupportedMethod(method)) {
      skipped.push({ method, path, sourceName, reason: "unsupported-method" });
      continue;
    }

    routes.push({
      method,
      path,
      status_code: 200,
      response_body: DEFAULT_BODY,
      delay_ms: 0,
      hasExample: false,
      sourceName,
    });
  }

  return {
    ok: true,
    error: null,
    format: "insomnia",
    collectionName: workspace?.name || "Imported collection",
    routes,
    skipped,
    truncated,
    formatSupportsExamples: false,
  };
}
