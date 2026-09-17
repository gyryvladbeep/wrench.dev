import { Metadata } from "next";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import { PublicWorkbenchView } from "@/components/workbench/PublicWorkbenchView";

// Публичные ссылки на рабочие столы — это произвольный пользовательский
// контент (набор чужих инструментов под именем, которое придумал автор),
// а не страница продукта. noindex, чтобы такие ссылки не индексировались
// поисковиками как отдельные "страницы сайта" — они существуют для
// шаринга по прямой ссылке, не для органического трафика.
export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const isRu = locale === "ru";
  return {
    title: isRu ? "Общий рабочий стол" : "Shared workbench",
    robots: { index: false, follow: false },
  };
}

export default async function PublicWorkbenchPage(props: { params: Promise<{ locale: string; id: string }> }) {
  const params = await props.params;
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  return <PublicWorkbenchView locale={locale} id={params.id} />;
}
