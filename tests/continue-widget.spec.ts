import { test, expect } from "@playwright/test";
import { pickContinueCandidate, WORKBENCH_STALE_DAYS } from "@/lib/continue-widget";

// ═══════════════════════════════════════════════════════════════
// pickContinueCandidate() — чистая функция (те же входы/выходы, без
// Supabase/DOM), поэтому без браузера, как и checkAchievements()
// (tests/achievements.spec.ts) и parseCollectionFile()
// (tests/mock-api-collection-parser.spec.ts). Сама выборка данных
// Supabase происходит в ContinueWidget.tsx и здесь не проверяется —
// для этого понадобился бы реальный аккаунт, как в mock-api-import.spec.ts.

const NOW = Date.parse("2026-09-17T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

function daysAgo(n: number): string {
  return new Date(NOW - n * DAY).toISOString();
}

test.describe("pickContinueCandidate — приоритет источников", () => {
  test("пусто везде — null", () => {
    expect(pickContinueCandidate({ unsolvedChallengeRole: null, trainerProgress: [], latestWorkbench: null, now: NOW })).toBeNull();
  });

  test("недорешённый челлендж побеждает трек Trainer и заброшенный Workbench одновременно", () => {
    const result = pickContinueCandidate({
      unsolvedChallengeRole: "qa",
      trainerProgress: [{ exercise_id: "fizzbuzz", solved_at: daysAgo(1) }],
      latestWorkbench: { name: "Main", tool_slugs: ["jwt-decoder"], updated_at: daysAgo(30) },
      now: NOW,
    });
    expect(result).toEqual({ kind: "challenge", role: "qa" });
  });

  test("без челленджа — недопройденный трек Trainer побеждает заброшенный Workbench", () => {
    const result = pickContinueCandidate({
      unsolvedChallengeRole: null,
      trainerProgress: [{ exercise_id: "sum-two-numbers", solved_at: daysAgo(1) }], // fundamentals: 1/2
      latestWorkbench: { name: "Main", tool_slugs: ["jwt-decoder"], updated_at: daysAgo(30) },
      now: NOW,
    });
    expect(result?.kind).toBe("trainer");
  });
});

test.describe("pickContinueCandidate — трек Trainer", () => {
  test("категория решена наполовину — кандидат с верными счётчиками", () => {
    const result = pickContinueCandidate({
      unsolvedChallengeRole: null,
      trainerProgress: [{ exercise_id: "find-max", solved_at: daysAgo(2) }], // arrays: 1/3
      latestWorkbench: null,
      now: NOW,
    });
    expect(result).toEqual(expect.objectContaining({ kind: "trainer", category: "arrays", solved: 1, total: 3 }));
  });

  test("категория решена полностью — не кандидат (пусто, не 'недопройдено')", () => {
    const result = pickContinueCandidate({
      unsolvedChallengeRole: null,
      trainerProgress: [{ exercise_id: "sum-two-numbers", solved_at: daysAgo(1) }, { exercise_id: "fizzbuzz", solved_at: daysAgo(1) }], // fundamentals: 2/2
      latestWorkbench: null,
      now: NOW,
    });
    expect(result).toBeNull();
  });

  test("категория не начата (0 решённых) — не кандидат", () => {
    // trainerProgress вообще не содержит ничего из arrays — она не
    // "недопройдена", она просто не начата, это не то же самое.
    const result = pickContinueCandidate({
      unsolvedChallengeRole: null,
      trainerProgress: [],
      latestWorkbench: null,
      now: NOW,
    });
    expect(result).toBeNull();
  });

  test("несколько недопройденных категорий — побеждает та, что трогали позже всего", () => {
    const result = pickContinueCandidate({
      unsolvedChallengeRole: null,
      trainerProgress: [
        { exercise_id: "sum-two-numbers", solved_at: daysAgo(10) }, // fundamentals: 1/2, давно
        { exercise_id: "find-max", solved_at: daysAgo(1) },          // arrays: 1/3, недавно
      ],
      latestWorkbench: null,
      now: NOW,
    });
    expect(result).toEqual(expect.objectContaining({ kind: "trainer", category: "arrays" }));
  });
});

test.describe("pickContinueCandidate — Workbench", () => {
  test("свежий (не устаревший) Workbench — не кандидат", () => {
    const result = pickContinueCandidate({
      unsolvedChallengeRole: null,
      trainerProgress: [],
      latestWorkbench: { name: "Main", tool_slugs: ["jwt-decoder"], updated_at: daysAgo(WORKBENCH_STALE_DAYS - 1) },
      now: NOW,
    });
    expect(result).toBeNull();
  });

  test("устаревший Workbench с инструментами — кандидат", () => {
    const result = pickContinueCandidate({
      unsolvedChallengeRole: null,
      trainerProgress: [],
      latestWorkbench: { name: "Main", tool_slugs: ["jwt-decoder", "json-formatter"], updated_at: daysAgo(WORKBENCH_STALE_DAYS) },
      now: NOW,
    });
    expect(result).toEqual({ kind: "workbench", name: "Main", toolCount: 2 });
  });

  test("устаревший, но пустой Workbench — не кандидат (нечего продолжать)", () => {
    const result = pickContinueCandidate({
      unsolvedChallengeRole: null,
      trainerProgress: [],
      latestWorkbench: { name: "Empty", tool_slugs: [], updated_at: daysAgo(60) },
      now: NOW,
    });
    expect(result).toBeNull();
  });

  test("Workbench вообще отсутствует — не кандидат", () => {
    const result = pickContinueCandidate({
      unsolvedChallengeRole: null,
      trainerProgress: [],
      latestWorkbench: null,
      now: NOW,
    });
    expect(result).toBeNull();
  });
});
