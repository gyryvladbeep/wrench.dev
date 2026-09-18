import { test, expect } from "@playwright/test";
import { checkRateLimit, rateLimitHeaders, getClientIp, __resetRateLimitState } from "@/lib/api-rate-limit";

// ═══════════════════════════════════════════════════════════════
// checkRateLimit()/getClientIp() — чистые функции (тот же приём, что
// уже у checkAchievements()/pickContinueCandidate()), без браузера.
// buckets — модульный Map, общий на весь процесс тестов, поэтому каждый
// тест зовёт __resetRateLimitState() в начале, иначе порядок выполнения
// тестов друг с другом мог бы влиять на результат.
// ═══════════════════════════════════════════════════════════════

const NOW = Date.parse("2026-09-18T12:00:00Z");
const MINUTE = 60_000;

test.describe("checkRateLimit — базовое окно", () => {
  test.beforeEach(() => __resetRateLimitState());

  test("первый запрос в новом окне — allowed, remaining = limit - 1", () => {
    const r = checkRateLimit("k1", 5, MINUTE, NOW);
    expect(r).toEqual({ allowed: true, limit: 5, remaining: 4, resetAt: NOW + MINUTE });
  });

  test("остаётся allowed вплоть до лимита включительно", () => {
    for (let i = 0; i < 5; i++) {
      const r = checkRateLimit("k2", 5, MINUTE, NOW + i * 1000);
      expect(r.allowed).toBe(true);
    }
  });

  test("(limit + 1)-й запрос в том же окне — заблокирован", () => {
    for (let i = 0; i < 5; i++) checkRateLimit("k3", 5, MINUTE, NOW + i * 1000);
    const r = checkRateLimit("k3", 5, MINUTE, NOW + 5000);
    expect(r.allowed).toBe(false);
    expect(r.remaining).toBe(0);
  });

  test("разные ключи не мешают друг другу", () => {
    for (let i = 0; i < 5; i++) checkRateLimit("shared-a", 5, MINUTE, NOW + i);
    // "shared-a" уже исчерпан, но "shared-b" — новый ключ, свежее окно.
    const r = checkRateLimit("shared-b", 5, MINUTE, NOW);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(4);
  });

  test("после истечения окна счётчик сбрасывается", () => {
    for (let i = 0; i < 5; i++) checkRateLimit("k4", 5, MINUTE, NOW);
    const blocked = checkRateLimit("k4", 5, MINUTE, NOW + 1000);
    expect(blocked.allowed).toBe(false);

    // Окно кончилось (прошло >= MINUTE от windowStart) — новый цикл.
    const r = checkRateLimit("k4", 5, MINUTE, NOW + MINUTE + 1);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(4);
  });
});

test.describe("rateLimitHeaders", () => {
  test("переводит результат в строковые HTTP-заголовки", () => {
    const headers = rateLimitHeaders({ allowed: true, limit: 60, remaining: 59, resetAt: 1_726_660_800_000 });
    expect(headers).toEqual({
      "X-RateLimit-Limit": "60",
      "X-RateLimit-Remaining": "59",
      "X-RateLimit-Reset": "1726660800",
    });
  });
});

test.describe("getClientIp", () => {
  test("берёт первый адрес из x-forwarded-for", () => {
    const h = new Headers({ "x-forwarded-for": "203.0.113.5, 10.0.0.1, 10.0.0.2" });
    expect(getClientIp(h)).toBe("203.0.113.5");
  });

  test("падает на x-real-ip, если x-forwarded-for нет", () => {
    const h = new Headers({ "x-real-ip": "198.51.100.7" });
    expect(getClientIp(h)).toBe("198.51.100.7");
  });

  test("оба заголовка отсутствуют — общий бакет 'unknown'", () => {
    const h = new Headers();
    expect(getClientIp(h)).toBe("unknown");
  });
});
