import { test, expect } from "@playwright/test";
import { generateApiToken, hashApiTokenBrowser, apiTokenPrefix, API_TOKEN_PREFIX } from "@/lib/api-token-crypto";
import { hashApiToken } from "@/lib/api-auth";

// ═══════════════════════════════════════════════════════════════
// Чистая логика lib/api-token-crypto.ts (клиент) и hashApiToken() из
// lib/api-auth.ts (сервер) — без браузера/Supabase, тот же приём, что
// у tests/api-rate-limit.spec.ts. Главное, что тут проверяется: клиент
// (Web Crypto SubtleCrypto) и сервер (Node crypto.createHash) должны
// давать ОДИНАКОВЫЙ hex-хэш для одной и той же строки токена — иначе
// authenticateApiRequest() в lib/api-auth.ts никогда не находил бы
// токен, созданный через useApiTokens.ts (components/profile/ApiTokensPanel.tsx).
// ═══════════════════════════════════════════════════════════════

test.describe("generateApiToken / apiTokenPrefix — формат токена", () => {
  test("токен начинается с wrb_ и содержит 48 hex-символов после префикса", () => {
    const token = generateApiToken();
    expect(token.startsWith(API_TOKEN_PREFIX)).toBe(true);
    const hex = token.slice(API_TOKEN_PREFIX.length);
    expect(hex).toMatch(/^[0-9a-f]{48}$/);
  });

  test("два вызова подряд не совпадают (случайность)", () => {
    const a = generateApiToken();
    const b = generateApiToken();
    expect(a).not.toBe(b);
  });

  test("apiTokenPrefix() возвращает префикс + первые 8 hex-символов", () => {
    const token = "wrb_abcdef0123456789restofthetoken";
    expect(apiTokenPrefix(token)).toBe("wrb_abcdef01");
  });
});

test.describe("hashApiTokenBrowser (клиент) vs hashApiToken (сервер) — согласованность", () => {
  test("одинаковая строка даёт одинаковый hex-хэш на клиенте и на сервере", async () => {
    const token = "wrb_deadbeef0000111122223333444455556666777788889999";
    const clientHash = await hashApiTokenBrowser(token);
    const serverHash = hashApiToken(token);
    expect(clientHash).toBe(serverHash);
    expect(clientHash).toMatch(/^[0-9a-f]{64}$/); // SHA-256 hex — 64 символа
  });

  test("разные токены дают разные хэши", async () => {
    const a = await hashApiTokenBrowser(generateApiToken());
    const b = await hashApiTokenBrowser(generateApiToken());
    expect(a).not.toBe(b);
  });
});
