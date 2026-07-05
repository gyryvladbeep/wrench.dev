import { Metadata } from "next";
import { isLocale, defaultLocale, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { categories, getToolsByCategory } from "@/lib/tools-registry";
import { localizeTools, localizeCategories } from "@/lib/i18n/localize";
import { buildPageMetadata } from "@/lib/seo";
import { ToolCard } from "@/components/ToolCard";
import { FavoritesSection } from "@/components/FavoritesSection";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);
  const t = dict.toolsIndexPage;
  return buildPageMetadata(locale, "/tools", t.metaTitle, t.metaDescription);
}

export default function ToolsIndexPage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);
  const t = dict.toolsIndexPage;
  const localizedCategories = localizeCategories(categories, locale);
  const isRu = locale === "ru";

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-text-primary md:text-3xl">{t.heading}</h1>
      <p className="mt-2 max-w-2xl text-text-muted">{t.description}</p>

      {/* Favorites section — client, reads localStorage */}
      <FavoritesSection />

      {localizedCategories.map((cat) => {
        const tools = localizeTools(getToolsByCategory(cat.slug), locale);
        if (tools.length === 0) return null;
        const implemented = tools.filter((t) => t.isImplemented);
        const coming      = tools.filter((t) => !t.isImplemented);
        return (
          <section key={cat.slug} className="mt-10">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-medium text-text-primary">{cat.name}</h2>
              <span className="text-xs text-text-muted">{implemented.length} {isRu ? "из" : "of"} {tools.length}</span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {implemented.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} locale={locale} dict={dict} />
              ))}
              {coming.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} locale={locale} dict={dict} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
