// ═══════════════════════════════════════════════════════════════
// In-memory fixed-window rate limiter — используется публичным API
// (app/api/v1/*), не чем-либо ещё на сайте. Осознанно БЕЗ
// Upstash/Redis: это бесплатный API соло-проекта, а не платный продукт
// с гарантированным SLA — Map в памяти процесса не идеальна (сбрасывается
// при холодном старте serverless-функции, не шарится между параллельно
// прогретыми инстансами/регионами Vercel), но честно решает реальную
// задачу — не дать одному скрипту в тесном цикле положить бесплатный
// эндпоинт — без новой внешней зависимости и её собственной цены/квоты.
// Тот же принцип "достаточно хорошо, не enterprise-grade", что уже
// применён к WORKBENCH_STALE_DAYS в lib/continue-widget.ts.
// ═══════════════════════════════════════════════════════════════

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

// Не даём Map расти бесконечно на процессе, который живёт долго (на
// serverless маловероятно, но дёшево подстраховаться) — часть вызовов
// check() попутно подметает точно устаревшие записи.
const MAX_BUCKETS = 5000;
const SWEEP_CHANCE = 0.01;
const SWEEP_TTL_MS = 10 * 60 * 1000; // с запасом — не обязаны знать здесь windowMs вызывающего кода

export interface RateLimitResult {
  allowed:   boolean;
  limit:     number;
  remaining: number;
  resetAt:   number; // мс epoch, когда открывается новое окно
}

export function checkRateLimit(key: string, limit: number, windowMs: number, now: number = Date.now()): RateLimitResult {
  if (buckets.size > MAX_BUCKETS || Math.random() < SWEEP_CHANCE) sweep(now);

  const existing = buckets.get(key);
  if (!existing || now - existing.windowStart >= windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, limit, remaining: limit - 1, resetAt: now + windowMs };
  }

  existing.count += 1;
  const resetAt = existing.windowStart + windowMs;
  if (existing.count > limit) {
    return { allowed: false, limit, remaining: 0, resetAt };
  }
  return { allowed: true, limit, remaining: limit - existing.count, resetAt };
}

function sweep(now: number) {
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > SWEEP_TTL_MS) buckets.delete(key);
  }
}

// Только для тестов — buckets модульный, общий на весь процесс, без
// сброса тесты зависели бы от порядка выполнения друг друга.
export function __resetRateLimitState() {
  buckets.clear();
}

export function rateLimitHeaders(r: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit":     String(r.limit),
    "X-RateLimit-Remaining": String(r.remaining),
    "X-RateLimit-Reset":     String(Math.ceil(r.resetAt / 1000)),
  };
}

// x-forwarded-for может содержать цепочку "client, proxy1, proxy2" —
// первый адрес и есть настоящий клиент (то же самое читает Vercel сам
// для req.geo/req.ip под капотом). Без обоих заголовков — общий бакет
// "unknown" на всех таких запросов сразу: не идеально точно, но не
// ломает лимит для всех остальных, у кого IP определился нормально.
export function getClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
