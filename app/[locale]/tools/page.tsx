import { Metadata } from "next";
import { isLocale, defaultLocale, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { categories, allTools } from "@/lib/tools-registry";
import { localizeTools, localizeCategories } from "@/lib/i18n/localize";
import { buildPageMetadata } from "@/lib/seo";
import { ToolCard } from "@/components/ToolCard";
import { FavoritesSection } from "@/components/FavoritesSection";
import Link from "next/link";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);
  const t = dict.toolsIndexPage;
  return buildPageMetadata(locale, "/tools", t.metaTitle, t.metaDescription);
}

const CATEGORY_ICONS: Record<string, string> = {
  formatting: "{ }", encoding: "⇄", text: "Aa", hash: "#",
  generators: "⚡", datetime: "⏱", web: "🌐", data: "⊞", qa: "✓", api: "→",
};

export default function ToolsIndexPage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);
  const t = dict.toolsIndexPage;
  const isRu = locale === "ru";

  const localizedCategories = localizeCategories(categories, locale);
  const totalImplemented = allTools.filter((t) => t.isImplemented).length;

  return (
    <div className="animate-fade-in">
      {/* ── Header ── */}
      <div className="border-b border-border bg-surface/30">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <h1 className="text-2xl font-bold text-text-primary md:text-3xl">{t.heading}</h1>
          <p className="mt-2 max-w-2xl text-text-muted">{t.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {localizedCategories.map((cat) => (
              <a key={cat.slug} href={`#${cat.slug}`}
                className="rounded-full border border-border bg-canvas px-3 py-1 text-xs text-text-muted hover:border-accent/40 hover:text-text-primary transition-colors">
                {CATEGORY_ICONS[cat.slug]} {cat.name}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Favorites */}
        <FavoritesSection />

        {/* Tools by category */}
        {localizedCategories.map((cat) => {
          const tools = localizeTools(allTools.filter((t) => t.category === cat.slug), locale);
          if (tools.length === 0) return null;
          const impl   = tools.filter((t) => t.isImplemented);
          const coming = tools.filter((t) => !t.isImplemented);

          return (
            <section key={cat.slug} id={cat.slug} className="mt-12 scroll-mt-20">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-accent text-base">{CATEGORY_ICONS[cat.slug]}</span>
                  <h2 className="text-lg font-semibold text-text-primary">{cat.name}</h2>
                  <span className="rounded-full bg-surface border border-border px-2 py-0.5 text-xs text-text-muted">
                    {impl.length}{coming.length > 0 ? `/${tools.length}` : ""}
                  </span>
                </div>
                <Link
                  href={localePath(locale, `/categories/${cat.slug}`)}
                  className="text-xs text-link hover:underline"
                >
                  {isRu ? "Все →" : "See all →"}
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger">
                {impl.map((tool) => (
                  <div key={tool.slug} className="animate-fade-in">
                    <ToolCard tool={tool} />
                  </div>
                ))}
                {coming.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
