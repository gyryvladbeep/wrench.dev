import { test, expect } from "@playwright/test";
import {
  CHANGELOG_ENTRIES,
  sortChangelogEntries,
  groupChangelogByMonth,
  formatChangelogMonthLabel,
  ChangelogEntry,
} from "@/lib/changelog";

// ═══════════════════════════════════════════════════════════════
// Чистая логика публичного changelog (roadmap item 24) — без {page}
// fixture, см. комментарий в lib/changelog.ts.
// ═══════════════════════════════════════════════════════════════

function entry(date: string, overrides: Partial<ChangelogEntry> = {}): ChangelogEntry {
  return {
    date, tag: "feature",
    titleEn: `title ${date}`, titleRu: `title ${date}`,
    descriptionEn: "d", descriptionRu: "d",
    ...overrides,
  };
}

test.describe("sortChangelogEntries", () => {
  test("сортирует по убыванию даты независимо от исходного порядка", () => {
    const sorted = sortChangelogEntries([entry("2026-09-13"), entry("2026-09-20"), entry("2026-09-17")]);
    expect(sorted.map((e) => e.date)).toEqual(["2026-09-20", "2026-09-17", "2026-09-13"]);
  });

  test("не мутирует исходный массив", () => {
    const original = [entry("2026-09-13"), entry("2026-09-20")];
    const originalCopy = [...original];
    sortChangelogEntries(original);
    expect(original).toEqual(originalCopy);
  });

  test("реальные CHANGELOG_ENTRIES из lib/changelog.ts сортируются без ошибок и остаются той же длины", () => {
    const sorted = sortChangelogEntries(CHANGELOG_ENTRIES);
    expect(sorted).toHaveLength(CHANGELOG_ENTRIES.length);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].date >= sorted[i].date).toBe(true);
    }
  });
});

test.describe("groupChangelogByMonth", () => {
  test("группирует подряд идущие записи одного месяца в одну группу", () => {
    const sorted = sortChangelogEntries([
      entry("2026-09-20"), entry("2026-09-15"), entry("2026-08-30"), entry("2026-08-01"),
    ]);
    const groups = groupChangelogByMonth(sorted);
    expect(groups.map((g) => g.monthKey)).toEqual(["2026-09", "2026-08"]);
    expect(groups[0].entries).toHaveLength(2);
    expect(groups[1].entries).toHaveLength(2);
  });

  test("пустой список — пустой список групп", () => {
    expect(groupChangelogByMonth([])).toEqual([]);
  });

  test("не схлопывает один и тот же месяц, если он не идёт подряд (несортированный вход) — так и задумано, вызывающий код должен сортировать первым", () => {
    const groups = groupChangelogByMonth([entry("2026-09-01"), entry("2026-08-01"), entry("2026-09-02")]);
    expect(groups.map((g) => g.monthKey)).toEqual(["2026-09", "2026-08", "2026-09"]);
  });
});

test.describe("formatChangelogMonthLabel", () => {
  test("английская метка месяца", () => {
    expect(formatChangelogMonthLabel("2026-09", false)).toBe("September 2026");
  });

  test("русская метка месяца, с заглавной буквы", () => {
    expect(formatChangelogMonthLabel("2026-09", true)).toBe("Сентябрь 2026");
  });

  test("январь и декабрь — граничные индексы", () => {
    expect(formatChangelogMonthLabel("2026-01", false)).toBe("January 2026");
    expect(formatChangelogMonthLabel("2026-12", false)).toBe("December 2026");
  });
});
