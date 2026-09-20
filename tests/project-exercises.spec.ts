import { test, expect } from "@playwright/test";
import { TRAINER_PROJECT_EXERCISES, validateProjectExercise } from "@/lib/trainer/project-exercises";
import { summarizeProjectResults } from "@/lib/trainer/run-project-exercise";

// ═══════════════════════════════════════════════════════════════
// Чистая логика проектных упражнений тренажёра (roadmap item 17) — без
// {page} fixture, см. комментарии в lib/trainer/project-exercises.ts и
// lib/trainer/run-project-exercise.ts.
// ═══════════════════════════════════════════════════════════════

test.describe("validateProjectExercise", () => {
  test("оба реальных упражнения из TRAINER_PROJECT_EXERCISES проходят без единой проблемы", () => {
    for (const exercise of TRAINER_PROJECT_EXERCISES) {
      expect(validateProjectExercise(exercise), `exercise "${exercise.id}"`).toEqual([]);
    }
  });

  test("ловит testId в actions, которого нет в startCode", () => {
    const problems = validateProjectExercise({
      id: "broken",
      difficulty: "easy",
      title: "t", titleRu: "t",
      prompt: "p", promptRu: "p",
      startCode: `<div data-testid="real"></div>`,
      checks: [{
        id: "c1", labelEn: "l", labelRu: "l",
        actions: [{ type: "click", testId: "typo-id" }],
        assertion: { type: "visible", testId: "real" },
      }],
    });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("typo-id");
  });

  test("ловит testId в assertion, которого нет в startCode", () => {
    const problems = validateProjectExercise({
      id: "broken",
      difficulty: "easy",
      title: "t", titleRu: "t",
      prompt: "p", promptRu: "p",
      startCode: `<div data-testid="real"></div>`,
      checks: [{
        id: "c1", labelEn: "l", labelRu: "l",
        actions: [],
        assertion: { type: "visible", testId: "missing" },
      }],
    });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("missing");
  });

  test("упражнение без единой проверки — тоже проблема", () => {
    const problems = validateProjectExercise({
      id: "empty",
      difficulty: "easy",
      title: "t", titleRu: "t",
      prompt: "p", promptRu: "p",
      startCode: `<div></div>`,
      checks: [],
    });
    expect(problems).toEqual([`exercise "empty" has no checks`]);
  });
});

test.describe("summarizeProjectResults", () => {
  test("ok только когда все проверки пройдены и их хотя бы одна", () => {
    expect(summarizeProjectResults([{ id: "a", pass: true }, { id: "b", pass: true }])).toEqual({ ok: true, passedCount: 2, totalCount: 2 });
  });

  test("одна упавшая проверка — ok: false", () => {
    expect(summarizeProjectResults([{ id: "a", pass: true }, { id: "b", pass: false }])).toEqual({ ok: false, passedCount: 1, totalCount: 2 });
  });

  test("пустой список результатов — ok: false, а не false по недосмотру", () => {
    expect(summarizeProjectResults([])).toEqual({ ok: false, passedCount: 0, totalCount: 0 });
  });

  test("все проверки упали", () => {
    expect(summarizeProjectResults([{ id: "a", pass: false }, { id: "b", pass: false }])).toEqual({ ok: false, passedCount: 0, totalCount: 2 });
  });
});
