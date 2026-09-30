import { test, expect } from "@playwright/test";
import { isNewAccount } from "@/lib/auth/is-new-account";

// ═══════════════════════════════════════════════════════════════
// Чистая логика "это первый вход через OAuth" (roadmap item 16,
// экскурсия по продукту при регистрации) — без {page} fixture, см.
// комментарий в lib/auth/is-new-account.ts.
// ═══════════════════════════════════════════════════════════════

test.describe("isNewAccount", () => {
  test("true когда created_at и last_sign_in_at совпадают", () => {
    const t = "2026-09-20T10:00:00.000Z";
    expect(isNewAccount(t, t)).toBe(true);
  });

  test("true когда разрыв меньше порога", () => {
    expect(isNewAccount("2026-09-20T10:00:00.000Z", "2026-09-20T10:00:03.000Z")).toBe(true);
  });

  test("false когда разрыв больше порога — старый аккаунт логинится снова", () => {
    expect(isNewAccount("2026-01-01T10:00:00.000Z", "2026-09-20T10:00:00.000Z")).toBe(false);
  });

  test("false на границе и сразу за ней", () => {
    expect(isNewAccount("2026-09-20T10:00:00.000Z", "2026-09-20T10:00:14.000Z", 15000)).toBe(true);
    expect(isNewAccount("2026-09-20T10:00:00.000Z", "2026-09-20T10:00:16.000Z", 15000)).toBe(false);
  });

  test("false при отсутствующих полях", () => {
    expect(isNewAccount(null, "2026-09-20T10:00:00.000Z")).toBe(false);
    expect(isNewAccount("2026-09-20T10:00:00.000Z", null)).toBe(false);
    expect(isNewAccount(undefined, undefined)).toBe(false);
  });

  test("false при битой дате вместо падения с исключением", () => {
    expect(isNewAccount("not-a-date", "2026-09-20T10:00:00.000Z")).toBe(false);
  });

  test("порог настраивается через третий аргумент", () => {
    expect(isNewAccount("2026-09-20T10:00:00.000Z", "2026-09-20T10:00:30.000Z", 60000)).toBe(true);
  });
});
