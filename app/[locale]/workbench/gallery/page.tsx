import { Metadata } from "next";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import { buildPageMetadata } from "@/lib/seo";
import { WorkbenchGalleryView } from "@/components/workbench/WorkbenchGalleryView";

// В отличие от /w/[id] (произвольная пользовательская ссылка, noindex —
// см. комментарий там же) эта страница — каталог, который сам и должен
// находиться поисковиком, тот же случай, что уже решён для /people и
// /salary: список существует независимо от того, куда именно ведёт
// каждая отдельная карточка.
export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const isRu   = locale === "ru";
  // Заголовок без "— Wrench-Branch" — см. комментарий в
  // app/[locale]/workbench/layout.tsx про дублирование названия сайта.
  return {
    ...buildPageMetadata(locale, "/workbench/gallery",
      isRu ? "Публичные рабочие столы" : "Public workbenches",
      isRu
        ? "Рабочие столы, которыми поделились другие пользователи Wrench-Branch — готовые наборы инструментов, которые можно склонировать себе."
        : "Workbenches other Wrench-Branch users have shared publicly — ready-made tool setups you can clone into your own account."
    ),
    // Родительский app/[locale]/workbench/layout.tsx помечает /workbench
    // целиком noindex (сама страница требует сессию) — эта страница
    // публичная и явно перекрывает унаследованный robots обратно на index.
    robots: { index: true, follow: true },
  };
}

export default async function WorkbenchGalleryPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  return <WorkbenchGalleryView locale={locale} />;
}
