import Link from "next/link";
import { Metadata } from "next";
import { isLocale, defaultLocale, localePath } from "@/lib/i18n/config";
import { formatResponseCount } from "@/lib/i18n/format";
import { buildPageMetadata, buildSalaryReportJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { SalaryRoleReportRow, SalaryCountryReportRow, sortRoleReportRows } from "@/lib/salary-report";
import { SalaryRoleReportTable, SalaryCountryReportTable } from "@/components/salary/SalaryReportTable";
import { GameIcon } from "@/components/icons/GameIcons";

// Пункт 23 из ROADMAP-BRAINSTORM.md — "авто-обновляемый отчёт на
// основе агрегатов уже существующего калькулятора зарплат". Тот же
// приём, что и у /leaderboard (пункт 22, см. подробный комментарий в
// app/[locale]/leaderboard/page.tsx): серверный рендер с клиентом без
// cookies() ради работающего ISR, а не тонкая обёртка + клиентский
// fetch, как у самого /salary — здесь роадмап явно просит "реально
// цепляющий контент для Reddit/Habr", то есть контент должен быть в
// отданном HTML для краулера и превью ссылки, а не в пустой оболочке.
export const revalidate = 3600;

async function getReport(): Promise<{
  roleRows: SalaryRoleReportRow[];
  countryRows: SalaryCountryReportRow[];
  totalCount: number;
}> {
  try {
    const supabase = createPublicSupabaseClient();
    if (!supabase) return { roleRows: [], countryRows: [], totalCount: 0 };

    const [roleResult, countryResult, countResult] = await Promise.all([
      supabase.rpc("get_salary_report_by_role"),
      supabase.rpc("get_salary_report_by_country"),
      supabase.rpc("get_salary_submission_count"),
    ]);

    return {
      roleRows: sortRoleReportRows((roleResult.data as SalaryRoleReportRow[] | null) ?? []),
      countryRows: (countryResult.data as SalaryCountryReportRow[] | null) ?? [],
      totalCount: (countResult.data as number | null) ?? 0,
    };
  } catch {
    // Любая сетевая/конфигурационная ошибка — пустой отчёт, страница
    // всё равно рендерится (с текстом "пока нет откликов"), не должна
    // ронять сборку/ISR-обновление целиком.
    return { roleRows: [], countryRows: [], totalCount: 0 };
  }
}

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const isRu   = locale === "ru";
  return buildPageMetadata(locale, "/salary/report",
    isRu ? "Зарплаты QA/Dev — срез рынка — Wrench-Branch" : "QA/Dev Salaries — Market Snapshot — Wrench-Branch",
    isRu
      ? "Медианные и средние зарплаты QA-инженеров и разработчиков по роли, уровню и стране — агрегированная статистика, собранная пользователями."
      : "Median and average QA/developer salaries by role, seniority and country — aggregated, crowd-sourced statistics."
  );
}

export default async function SalaryReportPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const isRu   = locale === "ru";
  const { roleRows, countryRows, totalCount } = await getReport();

  const homeLabel = isRu ? "Главная" : "Home";
  const salaryLabel = isRu ? "Зарплаты" : "Salaries";
  const reportLabel = isRu ? "Срез рынка зарплат" : "Salary Market Snapshot";

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <JsonLd data={buildSalaryReportJsonLd(locale, homeLabel, salaryLabel, reportLabel, totalCount)} />

      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-canvas text-accent">
          <GameIcon id="chart" size={22} />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-text-primary">{reportLabel}</h1>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          {isRu
            ? `Агрегированная статистика (${formatResponseCount(totalCount, locale)}) — анонимно, обновляется каждый час. Показатели скрыты там, где откликов меньше трёх — это защищает конкретных людей от деанонимизации по редкому сочетанию роли/уровня/страны.`
            : `Aggregated statistics (${formatResponseCount(totalCount, locale)}) — anonymous, updates hourly. Numbers are hidden wherever a segment has fewer than three responses, to keep any one person from being identifiable by a rare role/level/country combination.`}
        </p>
      </div>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold text-text-primary">
          {isRu ? "По роли и уровню" : "By role and level"}
        </h2>
        <SalaryRoleReportTable rows={roleRows} locale={locale} />
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold text-text-primary">
          {isRu ? "По стране" : "By country"}
        </h2>
        <SalaryCountryReportTable rows={countryRows} locale={locale} />
      </section>

      <p className="text-center text-xs text-text-muted">
        {isRu ? "Ещё не отправляли свою зарплату? " : "Haven't submitted yours yet? "}
        <Link href={localePath(locale, "/salary")} className="text-link hover:underline">
          {isRu ? "Заполните калькулятор" : "Fill in the calculator"}
        </Link>
        {isRu ? " — чем больше откликов, тем точнее срез." : " — more responses make this snapshot more accurate."}
      </p>
    </div>
  );
}
