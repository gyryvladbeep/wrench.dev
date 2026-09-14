import { Metadata } from "next";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import { buildPageMetadata } from "@/lib/seo";
import { PeopleDirectory } from "@/components/PeopleDirectory";

// Та же причина, что и у /u/[username]: осознанно НЕ закрываем от
// индексации (в отличие от /w/[id], произвольного пользовательского
// контента) — это каталог, который и должен находиться поисковиком.
export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const isRu   = locale === "ru";
  return buildPageMetadata(locale, "/people",
    isRu ? "Люди — Wrench-Branch" : "People — Wrench-Branch",
    isRu
      ? "Публичные профили участников Wrench-Branch — QA-инженеры, frontend и backend разработчики."
      : "Public profiles of Wrench-Branch members — QA engineers, frontend and backend developers."
  );
}

export default function PeoplePage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  return <PeopleDirectory locale={locale} />;
}
