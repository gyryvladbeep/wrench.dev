import { Metadata } from "next";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import { PublicWorkbenchView } from "@/components/workbench/PublicWorkbenchView";

// Публичные ссылки на рабочие столы — это произвольный пользовательский
// контент (набор чужих инструментов под именем, которое придумал автор),
// а не страница продукта. noindex, чтобы такие ссылки не индексировались
// поисковиками как отдельные "страницы сайта" — они существуют для
// шаринга по прямой ссылке, не для органического трафика.
export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const isRu = locale === "ru";
  return {
    title: isRu ? "Общий рабочий стол" : "Shared workbench",
    robots: { index: false, follow: false },
  };
}

export default function PublicWorkbenchPage({ params }: { params: { locale: string; id: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  return <PublicWorkbenchView locale={locale} id={params.id} />;
}
