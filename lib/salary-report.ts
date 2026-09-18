import { ROLE_TAGS } from "@/lib/profile-roles";
import { SENIORITY_LEVELS } from "@/lib/salary-options";

// Строки, отдаваемые get_salary_report_by_role()/get_salary_report_by_country()
// (supabase/salary-report-migration.sql) — поля с числами NULL, если
// не пройден порог анонимности (sample_size < 3), см. комментарий там же.
export interface SalaryRoleReportRow {
  role_tag: string;
  seniority: string;
  sample_size: number;
  median_usd: number | null;
  avg_usd: number | null;
  min_usd: number | null;
  max_usd: number | null;
}

export interface SalaryCountryReportRow {
  country: string;
  sample_size: number;
  median_usd: number | null;
  avg_usd: number | null;
  min_usd: number | null;
  max_usd: number | null;
}

export const SALARY_REPORT_MIN_SAMPLE = 3;

// SQL просто группирует по role_tag/seniority — без явного порядка это
// алфавитный порядок seniority ("junior" < "lead" < "middle" < "senior"
// < "trainee"), что не соответствует реальной карьерной лестнице.
// Сортируем на фронтенде по позиции в ROLE_TAGS/SENIORITY_LEVELS —
// том же каноническом порядке, что уже используется в форме
// калькулятора (components/salary/SalaryClient.tsx).
export function sortRoleReportRows(rows: SalaryRoleReportRow[]): SalaryRoleReportRow[] {
  const roleOrder = ROLE_TAGS.map((r) => r.id);
  const seniorityOrder = SENIORITY_LEVELS.map((s) => s.id);
  return [...rows].sort((a, b) => {
    const roleDiff = roleOrder.indexOf(a.role_tag) - roleOrder.indexOf(b.role_tag);
    if (roleDiff !== 0) return roleDiff;
    return seniorityOrder.indexOf(a.seniority) - seniorityOrder.indexOf(b.seniority);
  });
}
