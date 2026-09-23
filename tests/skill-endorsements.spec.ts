import { test, expect } from "@playwright/test";
import { groupEndorsementsByTag, isEndorsedByViewer, formatEndorserNames, countDistinctEndorsers, countDistinctEndorsedSkills } from "@/lib/skill-endorsements";

// ═══════════════════════════════════════════════════════════════
// Чистая логика peer-эндорсементов (roadmap item 2) — без {page}
// fixture, см. комментарий в lib/skill-endorsements.ts.
// ═══════════════════════════════════════════════════════════════

test.describe("groupEndorsementsByTag", () => {
  test("группирует строки по skill_tag", () => {
    const rows = [
      { skill_tag: "react", endorser_id: "a" },
      { skill_tag: "react", endorser_id: "b" },
      { skill_tag: "node", endorser_id: "a" },
    ];
    const grouped = groupEndorsementsByTag(rows);
    expect(grouped.get("react")?.length).toBe(2);
    expect(grouped.get("node")?.length).toBe(1);
    expect(grouped.get("typescript")).toBeUndefined();
  });

  test("пустой массив — пустая карта", () => {
    expect(groupEndorsementsByTag([]).size).toBe(0);
  });
});

test.describe("isEndorsedByViewer", () => {
  const rows = [
    { skill_tag: "react", endorser_id: "user-a" },
    { skill_tag: "react", endorser_id: "user-b" },
  ];

  test("true, если среди строк есть эндорсемент от этого зрителя", () => {
    expect(isEndorsedByViewer(rows, "user-a")).toBe(true);
  });

  test("false, если зрителя среди эндорсеров нет", () => {
    expect(isEndorsedByViewer(rows, "user-c")).toBe(false);
  });

  test("false для null/undefined viewerId (аноним)", () => {
    expect(isEndorsedByViewer(rows, null)).toBe(false);
    expect(isEndorsedByViewer(rows, undefined)).toBe(false);
  });
});

test.describe("formatEndorserNames", () => {
  test("пустой список — пустая строка", () => {
    expect(formatEndorserNames([], true)).toBe("");
  });

  test("до 3 имён — просто через запятую, без хвоста", () => {
    expect(formatEndorserNames(["Аня", "Вася"], true)).toBe("Аня, Вася");
    expect(formatEndorserNames(["Ann", "Bob", "Cid"], false)).toBe("Ann, Bob, Cid");
  });

  test("больше 3 — первые 3 плюс 'и ещё N' (ru) / 'and N more' (en)", () => {
    expect(formatEndorserNames(["Аня", "Вася", "Игорь", "Петя", "Оля"], true)).toBe("Аня, Вася, Игорь и ещё 2");
    expect(formatEndorserNames(["Ann", "Bob", "Cid", "Dan"], false)).toBe("Ann, Bob, Cid and 1 more");
  });
});

// roadmap item 1 (Skill-badges 2.0) — эти два счётчика идут прямо в
// checkAchievements() (см. tests/achievements.spec.ts), см. комментарий
// в lib/skill-endorsements.ts.
test.describe("countDistinctEndorsers", () => {
  test("считает уникальных эндорсеров, не строки", () => {
    const rows = [
      { skill_tag: "react", endorser_id: "a" },
      { skill_tag: "node",  endorser_id: "a" }, // тот же человек, другой навык
      { skill_tag: "react", endorser_id: "b" },
    ];
    expect(countDistinctEndorsers(rows)).toBe(2);
  });

  test("пустой список — 0", () => {
    expect(countDistinctEndorsers([])).toBe(0);
  });
});

test.describe("countDistinctEndorsedSkills", () => {
  test("считает уникальные навыки, не строки", () => {
    const rows = [
      { skill_tag: "react", endorser_id: "a" },
      { skill_tag: "react", endorser_id: "b" }, // тот же навык, другой человек
      { skill_tag: "node",  endorser_id: "a" },
    ];
    expect(countDistinctEndorsedSkills(rows)).toBe(2);
  });

  test("пустой список — 0", () => {
    expect(countDistinctEndorsedSkills([])).toBe(0);
  });
});
