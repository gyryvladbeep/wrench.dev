import { Metadata } from "next";
import Link from "next/link";
import { isLocale, defaultLocale, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { categories, allTools } from "@/lib/tools-registry";
import { localizeTools, localizeCategories } from "@/lib/i18n/localize";
import { buildPageMetadata } from "@/lib/seo";
import { ToolCard } from "@/components/ToolCard";
import { FavoritesSection } from "@/components/FavoritesSection";
import { CategoryIcon } from "@/components/CategoryIcon";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const t = getDictionary(locale).toolsIndexPage;
  return buildPageMetadata(locale, "/tools", t.metaTitle, t.metaDescription);
}

export default function ToolsIndexPage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict   = getDictionary(locale);
  const t      = dict.toolsIndexPage;
  const isRu   = locale === "ru";
  const localizedCategories = localizeCategories(categories, locale);
  const totalImplemented    = allTools.filter((t) => t.isImplemented).length;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="border-b border-border bg-surface/30">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <h1 className="text-2xl font-bold text-text-primary">{t.heading}</h1>
          <p className="mt-1.5 max-w-xl text-sm text-text-muted">{t.description}</p>

          {/* Category anchor nav */}
          <div className="mt-5 flex flex-wrap gap-2">
            {localizedCategories.map((cat) => (
              <a key={cat.slug} href={`#${cat.slug}`}
                className="flex items-center gap-1.5 rounded-md border border-border bg-canvas px-2.5 py-1 text-xs text-text-muted hover:border-accent/30 hover:text-text-primary transition-colors">
                <CategoryIcon category={cat.slug} size={11} className="opacity-60" />
                {cat.name}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Favorites */}
        <FavoritesSection />

        {/* By category */}
        {localizedCategories.map((cat) => {
          const tools = localizeTools(allTools.filter((t) => t.category === cat.slug), locale);
          if (tools.length === 0) return null;
          const impl   = tools.filter((t) => t.isImplemented);
          const coming = tools.filter((t) => !t.isImplemented);
          return (
            <section key={cat.slug} id={cat.slug} className="mt-12 scroll-mt-20">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-text-muted"><CategoryIcon category={cat.slug} size={15} /></span>
                  <h2 className="text-base font-semibold text-text-primary">{cat.name}</h2>
                  <span className="rounded border border-border bg-surface px-1.5 py-px text-[10px] text-text-muted">
                    {impl.length}{coming.length > 0 ? `/${tools.length}` : ""}
                  </span>
                </div>
                <Link href={localePath(locale, `/categories/${cat.slug}`)} className="text-xs text-link hover:underline">
                  {isRu ? "Все →" : "See all →"}
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 stagger">
                {impl.map((tool) => <div key={tool.slug} className="animate-fade-in"><ToolCard tool={tool} /></div>)}
                {coming.map((tool) => <ToolCard key={tool.slug} tool={tool} />)}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
