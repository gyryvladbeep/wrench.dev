import { test, expect } from "@playwright/test";
import { sortRoleReportRows, SalaryRoleReportRow } from "@/lib/salary-report";
import { formatResponseCount } from "@/lib/i18n/format";

// ═══════════════════════════════════════════════════════════════
// sortRoleReportRows()/formatResponseCount() — чистые функции, тот же
// приём, что и у tests/api-rate-limit.spec.ts (без браузера). Главное,
// что тут проверяется: SQL группирует по role_tag/seniority без
// явного ORDER BY, и алфавитный порядок seniority ("junior" < "lead"
// < ...) не совпадает с карьерной лестницей — sortRoleReportRows()
// должна восстанавливать канонический порядок.
// ═══════════════════════════════════════════════════════════════

function row(role: string, seniority: string): SalaryRoleReportRow {
  return { role_tag: role, seniority, sample_size: 5, median_usd: 1000, avg_usd: 1000, min_usd: 900, max_usd: 1100 };
}

test.describe("sortRoleReportRows", () => {
  test("сортирует уровни по карьерной лестнице, не по алфавиту", () => {
    // Алфавитный порядок был бы: junior, lead, middle, senior, trainee.
    const rows = [row("qa", "lead"), row("qa", "trainee"), row("qa", "senior"), row("qa", "junior"), row("qa", "middle")];
    const sorted = sortRoleReportRows(rows).map((r) => r.seniority);
    expect(sorted).toEqual(["trainee", "junior", "middle", "senior", "lead"]);
  });

  test("группирует по роли в порядке ROLE_TAGS, затем по уровню внутри роли", () => {
    const rows = [row("devops", "junior"), row("qa", "senior"), row("qa", "junior")];
    const sorted = sortRoleReportRows(rows).map((r) => `${r.role_tag}-${r.seniority}`);
    // qa идёт раньше devops в ROLE_TAGS (lib/profile-roles.ts).
    expect(sorted).toEqual(["qa-junior", "qa-senior", "devops-junior"]);
  });

  test("не мутирует исходный массив", () => {
    const rows = [row("qa", "senior"), row("qa", "junior")];
    const original = [...rows];
    sortRoleReportRows(rows);
    expect(rows).toEqual(original);
  });

  test("пустой массив — пустой результат", () => {
    expect(sortRoleReportRows([])).toEqual([]);
  });
});

test.describe("formatResponseCount", () => {
  test("английская форма — единственное/множественное число", () => {
    expect(formatResponseCount(1, "en")).toBe("1 response");
    expect(formatResponseCount(0, "en")).toBe("0 responses");
    expect(formatResponseCount(5, "en")).toBe("5 responses");
  });

  test("русская форма — различает 1 / 2-4 / 5+, включая 11-14", () => {
    expect(formatResponseCount(1, "ru")).toBe("1 отклик");
    expect(formatResponseCount(21, "ru")).toBe("21 отклик");
    expect(formatResponseCount(2, "ru")).toBe("2 отклика");
    expect(formatResponseCount(4, "ru")).toBe("4 отклика");
    expect(formatResponseCount(5, "ru")).toBe("5 откликов");
    expect(formatResponseCount(11, "ru")).toBe("11 откликов");
    expect(formatResponseCount(14, "ru")).toBe("14 откликов");
    expect(formatResponseCount(111, "ru")).toBe("111 откликов");
  });
});
