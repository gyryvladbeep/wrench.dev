import { test, expect } from "@playwright/test";
import { checkAchievements, BADGES, FOUNDING_MEMBER_CUTOFF } from "@/lib/achievements";

// ═══════════════════════════════════════════════════════════════
// checkAchievements() — чистая функция (числа/булевы флаги на входе,
// массив id на выходе), поэтому без браузера, как и
// mock-api-collection-parser.spec.ts. Достижения как статус
// (2026-09-17): эти тесты покрывают именно расширенный пул и новые
// производные поля — само сохранение в БД (achievements upsert,
// FK profiles_equipped_badge_fk) требует реального Supabase и не
// проверяется здесь без .env.local в песочнице.

const BASE = { total_solved: 0, total_points: 0, current_streak: 0 };

test.describe("checkAchievements — базовые пороги (не сломаны расширением)", () => {
  test("пустая статистика — ничего не заработано", () => {
    expect(checkAchievements(BASE)).toEqual([]);
  });

  test("первая решённая задача даёт first_solve", () => {
    expect(checkAchievements({ ...BASE, total_solved: 1 })).toContain("first_solve");
  });

  test("стрик 3/7/30/100 — накопительно, младшие пороги не пропадают", () => {
    const earned = checkAchievements({ ...BASE, current_streak: 100 });
    expect(earned).toEqual(expect.arrayContaining(["streak_3", "streak_7", "streak_30", "streak_100"]));
  });
});

test.describe("checkAchievements — новые производные поля", () => {
  test("generalist требует хотя бы по одной задаче в каждой из трёх ролей", () => {
    expect(checkAchievements({ ...BASE, qa_solved: 1, frontend_solved: 1 })).not.toContain("generalist");
    expect(checkAchievements({ ...BASE, qa_solved: 1, frontend_solved: 1, backend_solved: 1 })).toContain("generalist");
  });

  test("hard_mode — 5 сложных задач", () => {
    expect(checkAchievements({ ...BASE, hard_solved: 4 })).not.toContain("hard_mode");
    expect(checkAchievements({ ...BASE, hard_solved: 5 })).toContain("hard_mode");
  });

  test("workbench_architect (3) и over_engineer (5) — разные пороги одного счётчика", () => {
    const earned = checkAchievements({ ...BASE, workbench_count: 3 });
    expect(earned).toContain("workbench_architect");
    expect(earned).not.toContain("over_engineer");
    expect(checkAchievements({ ...BASE, workbench_count: 5 })).toContain("over_engineer");
  });

  test("tool_belt — 15+ закреплённых инструментов в рабочих столах", () => {
    expect(checkAchievements({ ...BASE, workbench_tools_count: 14 })).not.toContain("tool_belt");
    expect(checkAchievements({ ...BASE, workbench_tools_count: 15 })).toContain("tool_belt");
  });

  test("polyglot / one_trick_pony — независимые метрики использования инструментов", () => {
    expect(checkAchievements({ ...BASE, distinct_tools_used: 15 })).toContain("polyglot");
    expect(checkAchievements({ ...BASE, max_single_tool_uses: 20 })).toContain("one_trick_pony");
    // Много разных инструментов не означает залипание на одном — и наоборот.
    expect(checkAchievements({ ...BASE, distinct_tools_used: 15 })).not.toContain("one_trick_pony");
  });

  test("pack_rat — 25+ избранных инструментов", () => {
    expect(checkAchievements({ ...BASE, favorites_count: 24 })).not.toContain("pack_rat");
    expect(checkAchievements({ ...BASE, favorites_count: 25 })).toContain("pack_rat");
  });

  test("insomniac / weekend_warrior — булевы флаги, не числовые пороги", () => {
    expect(checkAchievements({ ...BASE, used_night_hours: true })).toContain("insomniac");
    expect(checkAchievements({ ...BASE, used_weekend: true })).toContain("weekend_warrior");
    expect(checkAchievements(BASE)).not.toEqual(expect.arrayContaining(["insomniac", "weekend_warrior"]));
  });
});

test.describe("checkAchievements — phoenix (главная причина переезда бейджей в БД)", () => {
  test("сброшенный стрик после 7+ дней, но задачи решались — phoenix", () => {
    const earned = checkAchievements({ total_solved: 5, total_points: 50, current_streak: 0, longest_streak: 10 });
    expect(earned).toContain("phoenix");
    // current_streak сейчас 0 — streak_3/7/30 в этом же вызове не должны
    // появляться (именно это "живое" поведение раньше прятало прогресс).
    expect(earned).not.toEqual(expect.arrayContaining(["streak_3", "streak_7", "streak_30"]));
  });

  test("короткий (<7 дней) сброшенный стрик — не phoenix", () => {
    expect(checkAchievements({ total_solved: 5, total_points: 50, current_streak: 0, longest_streak: 5 })).not.toContain("phoenix");
  });

  test("стрик ещё живой (current_streak > 0) — не phoenix, даже с большим longest_streak", () => {
    expect(checkAchievements({ total_solved: 5, total_points: 50, current_streak: 2, longest_streak: 30 })).not.toContain("phoenix");
  });
});

test.describe("checkAchievements — шуточные (точное совпадение, не порог)", () => {
  test("the_answer — ровно 42 решённых, не 41 и не 43", () => {
    expect(checkAchievements({ ...BASE, total_solved: 41 })).not.toContain("the_answer");
    expect(checkAchievements({ ...BASE, total_solved: 42 })).toContain("the_answer");
    expect(checkAchievements({ ...BASE, total_solved: 43 })).not.toContain("the_answer");
  });

  test("leet — ровно 1337 очков", () => {
    expect(checkAchievements({ ...BASE, total_points: 1337 })).toContain("leet");
    expect(checkAchievements({ ...BASE, total_points: 1338 })).not.toContain("leet");
  });
});

test.describe("checkAchievements — founding_member (дата отсечки)", () => {
  test("аккаунт до отсечки — founding_member", () => {
    const before = new Date(FOUNDING_MEMBER_CUTOFF - 24 * 60 * 60 * 1000).toISOString();
    expect(checkAchievements({ ...BASE, account_created_at: before })).toContain("founding_member");
  });

  test("аккаунт после отсечки — не founding_member", () => {
    const after = new Date(FOUNDING_MEMBER_CUTOFF + 24 * 60 * 60 * 1000).toISOString();
    expect(checkAchievements({ ...BASE, account_created_at: after })).not.toContain("founding_member");
  });

  test("без account_created_at — не падает, просто не засчитывается", () => {
    expect(checkAchievements(BASE)).not.toContain("founding_member");
  });
});

test.describe("BADGES — целостность данных", () => {
  test("каждый id уникален", () => {
    const ids = BADGES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("для каждого возможного id из checkAchievements есть определение в BADGES", () => {
    // Прогоняем через щедрый набор входных данных, чтобы сработали все
    // ветки функции разом, и сверяем, что каждый вернувшийся id имеет
    // соответствующую запись в BADGES — иначе он отрендерится как
    // "пустая" карточка (см. `if (!b) return null;` в page.tsx/PublicProfileView.tsx).
    const generous = checkAchievements({
      total_solved: 250, total_points: 5000, current_streak: 100, longest_streak: 100,
      qa_solved: 10, frontend_solved: 10, backend_solved: 10, hard_solved: 5,
      isPro: true, favorites_count: 25, workbench_count: 5, workbench_tools_count: 15,
      distinct_tools_used: 15, max_single_tool_uses: 20, used_night_hours: true, used_weekend: true,
      account_created_at: new Date(FOUNDING_MEMBER_CUTOFF - 1000).toISOString(),
    });
    const badgeIds = new Set(BADGES.map((b) => b.id));
    for (const id of generous) expect(badgeIds.has(id)).toBe(true);
  });
});
