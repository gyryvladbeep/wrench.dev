import { Metadata } from "next";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import { buildPageMetadata } from "@/lib/seo";
import { SalaryClient } from "@/components/salary/SalaryClient";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const isRu   = locale === "ru";
  return buildPageMetadata(locale, "/salary",
    isRu ? "Калькулятор зарплат QA/Dev — Wrench-Branch" : "QA/Dev Salary Calculator — Wrench-Branch",
    isRu
      ? "Зарплаты QA-инженеров и разработчиков по роли, уровню и стране — собрано самими пользователями."
      : "QA and developer salaries by role, level and country — crowd-sourced from real users."
  );
}

export default function SalaryPage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  return <SalaryClient locale={locale} />;
}
