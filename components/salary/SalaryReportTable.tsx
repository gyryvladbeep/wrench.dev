import { ROLE_TAGS } from "@/lib/profile-roles";
import { SENIORITY_LEVELS, COUNTRIES, formatUsd } from "@/lib/salary-options";
import { SalaryRoleReportRow, SalaryCountryReportRow, SALARY_REPORT_MIN_SAMPLE } from "@/lib/salary-report";

// ═══════════════════════════════════════════════════════════════
// Чисто презентационные таблицы — тот же принцип, что и у
// LeaderboardTable.tsx (без "use client", данные приходят готовыми
// пропом от серверной страницы app/[locale]/salary/report/page.tsx).
// ═══════════════════════════════════════════════════════════════

function roleLabel(id: string, isRu: boolean): string {
  const r = ROLE_TAGS.find((x) => x.id === id);
  return r ? (isRu ? r.labelRu : r.label) : id;
}

function seniorityLabel(id: string, isRu: boolean): string {
  const s = SENIORITY_LEVELS.find((x) => x.id === id);
  return s ? (isRu ? s.labelRu : s.label) : id;
}

function countryLabel(id: string, isRu: boolean): string {
  const c = COUNTRIES.find((x) => x.id === id);
  return c ? (isRu ? c.labelRu : c.label) : id;
}

function RangeCell({ min, max }: { min: number | null; max: number | null }) {
  if (min === null || max === null) return <span className="text-text-disabled">—</span>;
  return <span>{formatUsd(min)}–{formatUsd(max)}</span>;
}

function InsufficientBadge({ isRu }: { isRu: boolean }) {
  return (
    <span className="text-text-disabled" title={isRu ? "Недостаточно данных" : "Not enough data"}>
      —
    </span>
  );
}

export function SalaryRoleReportTable({ rows, locale }: { rows: SalaryRoleReportRow[]; locale: string }) {
  const isRu = locale === "ru";
  if (rows.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        {isRu ? "Пока нет откликов." : "No responses yet."}
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border bg-surface text-left text-xs text-text-muted">
            <th className="py-2 pl-3 pr-2 font-normal">{isRu ? "Роль" : "Role"}</th>
            <th className="py-2 pr-2 font-normal">{isRu ? "Уровень" : "Level"}</th>
            <th className="py-2 pr-2 text-right font-normal">{isRu ? "Откликов" : "Responses"}</th>
            <th className="py-2 pr-2 text-right font-normal">{isRu ? "Медиана" : "Median"}</th>
            <th className="py-2 pr-2 text-right font-normal">{isRu ? "Среднее" : "Average"}</th>
            <th className="py-2 pr-3 text-right font-normal">{isRu ? "Диапазон" : "Range"}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const enough = r.sample_size >= SALARY_REPORT_MIN_SAMPLE;
            return (
              <tr key={`${r.role_tag}-${r.seniority}`} className="border-t border-border/60">
                <td className="py-2 pl-3 pr-2 text-text-primary">{roleLabel(r.role_tag, isRu)}</td>
                <td className="py-2 pr-2 text-text-secondary">{seniorityLabel(r.seniority, isRu)}</td>
                <td className="py-2 pr-2 text-right font-mono text-xs tabular-nums text-text-muted">{r.sample_size}</td>
                <td className="py-2 pr-2 text-right font-mono text-xs tabular-nums text-text-primary">
                  {enough ? formatUsd(r.median_usd) : <InsufficientBadge isRu={isRu} />}
                </td>
                <td className="py-2 pr-2 text-right font-mono text-xs tabular-nums text-text-secondary">
                  {enough ? formatUsd(r.avg_usd) : <InsufficientBadge isRu={isRu} />}
                </td>
                <td className="py-2 pr-3 text-right font-mono text-xs tabular-nums text-text-secondary">
                  {enough ? <RangeCell min={r.min_usd} max={r.max_usd} /> : <InsufficientBadge isRu={isRu} />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function SalaryCountryReportTable({ rows, locale }: { rows: SalaryCountryReportRow[]; locale: string }) {
  const isRu = locale === "ru";
  if (rows.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        {isRu ? "Пока нет откликов." : "No responses yet."}
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-border bg-surface text-left text-xs text-text-muted">
            <th className="py-2 pl-3 pr-2 font-normal">{isRu ? "Страна" : "Country"}</th>
            <th className="py-2 pr-2 text-right font-normal">{isRu ? "Откликов" : "Responses"}</th>
            <th className="py-2 pr-2 text-right font-normal">{isRu ? "Медиана" : "Median"}</th>
            <th className="py-2 pr-2 text-right font-normal">{isRu ? "Среднее" : "Average"}</th>
            <th className="py-2 pr-3 text-right font-normal">{isRu ? "Диапазон" : "Range"}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const enough = r.sample_size >= SALARY_REPORT_MIN_SAMPLE;
            return (
              <tr key={r.country} className="border-t border-border/60">
                <td className="py-2 pl-3 pr-2 text-text-primary">{countryLabel(r.country, isRu)}</td>
                <td className="py-2 pr-2 text-right font-mono text-xs tabular-nums text-text-muted">{r.sample_size}</td>
                <td className="py-2 pr-2 text-right font-mono text-xs tabular-nums text-text-primary">
                  {enough ? formatUsd(r.median_usd) : <InsufficientBadge isRu={isRu} />}
                </td>
                <td className="py-2 pr-2 text-right font-mono text-xs tabular-nums text-text-secondary">
                  {enough ? formatUsd(r.avg_usd) : <InsufficientBadge isRu={isRu} />}
                </td>
                <td className="py-2 pr-3 text-right font-mono text-xs tabular-nums text-text-secondary">
                  {enough ? <RangeCell min={r.min_usd} max={r.max_usd} /> : <InsufficientBadge isRu={isRu} />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
