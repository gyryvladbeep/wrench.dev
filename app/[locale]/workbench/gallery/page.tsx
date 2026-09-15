import { Metadata } from "next";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import { buildPageMetadata } from "@/lib/seo";
import { WorkbenchGalleryView } from "@/components/workbench/WorkbenchGalleryView";

// В отличие от /w/[id] (произвольная пользовательская ссылка, noindex —
// см. комментарий там же) эта страница — каталог, который сам и должен
// находиться поисковиком, тот же случай, что уже решён для /people и
// /salary: список существует независимо от того, куда именно ведёт
// каждая отдельная карточка.
export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const isRu   = locale === "ru";
  return buildPageMetadata(locale, "/workbench/gallery",
    isRu ? "Публичные рабочие столы — Wrench-Branch" : "Public workbenches — Wrench-Branch",
    isRu
      ? "Рабочие столы, которыми поделились другие пользователи Wrench-Branch — готовые наборы инструментов, которые можно склонировать себе."
      : "Workbenches other Wrench-Branch users have shared publicly — ready-made tool setups you can clone into your own account."
  );
}

export default function WorkbenchGalleryPage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  return <WorkbenchGalleryView locale={locale} />;
}
