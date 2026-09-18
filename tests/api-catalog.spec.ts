import { test, expect } from "@playwright/test";
import {
  listPublicTools, getPublicToolDetail, buildOpenApiSpec, buildPostmanCollection,
  toPublicToolSummary, API_VERSION,
} from "@/lib/api-catalog";
import { getImplementedTools } from "@/lib/tools-registry";

// ═══════════════════════════════════════════════════════════════
// Чистые функции над статическим реестром инструментов (lib/tools-registry.ts)
// — без Supabase/DOM, тем же приёмом, что уже у achievements.spec.ts и
// continue-widget.spec.ts. Route-хендлеры (app/api/v1/**/route.ts) сами
// не тестируются здесь — они только вызывают эти функции и оборачивают
// результат в NextResponse/rate-limit заголовки, вся ветвящаяся логика
// живёт тут.
// ═══════════════════════════════════════════════════════════════

test.describe("listPublicTools", () => {
  test("возвращает все реализованные инструменты, столько же, сколько getImplementedTools()", () => {
    const tools = listPublicTools();
    expect(tools.length).toBe(getImplementedTools().length);
    expect(tools.length).toBeGreaterThan(0);
  });

  test("каждая запись — плоский объект метаданных с абсолютным url", () => {
    const tools = listPublicTools();
    for (const t of tools.slice(0, 5)) {
      expect(t.slug).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.url).toBe(`https://wrench-branch.vercel.app/tools/${t.slug}`);
    }
  });

  test("фильтр по category отдаёт только эту категорию", () => {
    const all = listPublicTools();
    const someCategory = all[0].category;
    const filtered = listPublicTools(someCategory);
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((t) => t.category === someCategory)).toBe(true);
  });

  test("несуществующая категория — пустой список, не ошибка", () => {
    expect(listPublicTools("no-such-category")).toEqual([]);
  });
});

test.describe("getPublicToolDetail", () => {
  test("известный, реализованный слаг — детальный объект с непустым longDescription", () => {
    const detail = getPublicToolDetail("json-formatter");
    expect(detail).not.toBeNull();
    expect(detail!.slug).toBe("json-formatter");
    expect(detail!.longDescription.length).toBeGreaterThan(0);
    expect(Array.isArray(detail!.howToSteps)).toBe(true);
    expect(Array.isArray(detail!.faqs)).toBe(true);
  });

  test("несуществующий слаг — null, не исключение", () => {
    expect(getPublicToolDetail("this-tool-does-not-exist-xyz")).toBeNull();
  });
});

test.describe("toPublicToolSummary", () => {
  test("не протаскивает внутренние поля (isHidden/isFeatured/...) наружу", () => {
    const summary = toPublicToolSummary({
      slug: "x", name: "X", shortDescription: "d", longDescription: "l", metaDescription: "m",
      category: "formatting", isImplemented: true, isHidden: true, keywords: ["a"],
    } as any);
    expect(summary).toEqual({
      slug: "x", name: "X", shortDescription: "d", category: "formatting", keywords: ["a"],
      url: "https://wrench-branch.vercel.app/tools/x",
    });
  });
});

test.describe("buildOpenApiSpec", () => {
  test("описывает оба публичных маршрута и версию API", () => {
    const spec = buildOpenApiSpec();
    expect(spec.openapi).toBe("3.0.3");
    expect(spec.info.version).toBe(API_VERSION);
    expect(Object.keys(spec.paths)).toEqual(["/tools", "/tools/{slug}"]);
    expect(spec.servers[0].url).toBe(`https://wrench-branch.vercel.app/api/${API_VERSION}`);
  });
});

test.describe("buildPostmanCollection", () => {
  test("3 запроса, все GET, с абсолютными URL", () => {
    const collection = buildPostmanCollection();
    expect(collection.item.length).toBe(3);
    for (const item of collection.item) {
      expect(item.request.method).toBe("GET");
      expect(item.request.url.raw.startsWith("https://wrench-branch.vercel.app/api/v1/")).toBe(true);
    }
  });

  test("запрос с ?category=formatting несёт разобранный query-массив", () => {
    const collection = buildPostmanCollection();
    const byCategory = collection.item.find((i) => i.request.url.raw.includes("category="))!;
    expect((byCategory.request.url as any).query).toEqual([{ key: "category", value: "formatting" }]);
  });
});
