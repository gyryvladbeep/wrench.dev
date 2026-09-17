import { Metadata } from "next";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import { buildPageMetadata } from "@/lib/seo";

// /workbench/page.tsx — "use client" (использует useAuth/useWorkbenches),
// поэтому не может сам экспортировать generateMetadata: раньше это
// означало, что вкладка молча наследовала заголовок и описание с главной
// страницы сайта. Заодно: без сессии страница рендерит null и уводит на
// /auth/login — та же причина, по которой /workbench сознательно
// пропущен в sitemap.ts (в отличие от /workbench/gallery — публичного
// каталога чужих рабочих столов, чья generateMetadata ниже по дереву
// явно перекрывает этот noindex через свой собственный robots).
export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const isRu   = locale === "ru";
  // Заголовок без "— Wrench-Branch" — его добавляет один раз шаблон
  // title.template корневого layout (app/layout.tsx). buildToolMetadata /
  // buildArticleMetadata пишут название сайта прямо в title и из-за этого
  // на каждой странице инструмента и статьи он сейчас дублируется (сайт
  // подставляет его второй раз через тот же шаблон) — отдельный,
  // существовавший до этого раунда баг вне текущего IA/SEO-пакета.
  return {
    ...buildPageMetadata(locale, "/workbench",
      isRu ? "Рабочий стол" : "Workbench",
      isRu
        ? "Личный рабочий стол с инструментами Wrench-Branch — собери свою панель и сохрани её в своём аккаунте."
        : "Your personal Wrench-Branch workbench — arrange the tools you use most and save the layout to your account."
    ),
    robots: { index: false, follow: false },
  };
}

export default function WorkbenchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
