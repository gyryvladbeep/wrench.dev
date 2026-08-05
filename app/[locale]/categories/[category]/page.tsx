import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { categories, getCategoryBySlug, allTools } from "@/lib/tools-registry";
import { isLocale, defaultLocale, locales, localePath } from "@/lib/i18n/config";
import { ToolCategory } from "@/lib/types";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizeTools, localizeCategory } from "@/lib/i18n/localize";
import { buildCategoryMetadata } from "@/lib/seo";
import { categoryHeading } from "@/lib/i18n/format";
import { ToolCard } from "@/components/ToolCard";

const CATEGORY_ICONS: Record<string, string> = {
  formatting: "{ }", encoding: "⇄", text: "Aa", hash: "#",
  generators: "⚡", datetime: "⏱", web: "🌐", data: "⊞", qa: "✓", api: "→",
};

// Related category suggestions per category
const RELATED: Record<string, string[]> = {
  formatting:  ["encoding", "text"],
  encoding:    ["formatting", "hash"],
  text:        ["generators", "formatting"],
  hash:        ["encoding", "api"],
  generators:  ["data", "text"],
  datetime:    ["generators", "api"],
  web:         ["api", "encoding"],
  data:        ["generators", "qa"],
  qa:          ["api", "text"],
  api:         ["web", "qa"],
};

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    categories.map((c) => ({ locale, category: c.slug }))
  );
}

export async function generateMetadata({ params }: { params: { locale: string; category: string } }): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);
  const cat = getCategoryBySlug(params.category as ToolCategory);
  if (!cat) return {};
  const localized = localizeCategory(cat, locale);
  return buildCategoryMetadata(locale, cat.slug, categoryHeading(localized.name, locale), localized.description);
}

export default function CategoryPage({ params }: { params: { locale: string; category: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);
  const isRu = locale === "ru";

  const cat = getCategoryBySlug(params.category as ToolCategory);
  if (!cat) notFound();

  const localizedCat = localizeCategory(cat, locale);
  const tools = allTools.filter((t) => t.category === cat.slug);
  const localizedTools = localizeTools(tools, locale);
  const implemented = localizedTools.filter((t) => t.isImplemented);
  const coming = localizedTools.filter((t) => !t.isImplemented);
  const heading = categoryHeading(localizedCat.name, locale);

  const relatedSlugs = RELATED[cat.slug] ?? [];
  const relatedCats = relatedSlugs
    .map((s) => getCategoryBySlug(s as ToolCategory))
    .filter(Boolean)
    .map((c) => localizeCategory(c!, locale));

  return (
    <div className="animate-fade-in">
      {/* ── Hero ── */}
      <div className="border-b border-border bg-surface/30">
        <div className="mx-auto max-w-6xl px-6 py-10">
          {/* Breadcrumb */}
          <nav className="mb-4 flex items-center gap-1.5 text-xs text-text-muted">
            <Link href={localePath(locale, "/")} className="hover:text-text-primary transition-colors">
              {dict.toolLayout.home}
            </Link>
            <span>/</span>
            <Link href={localePath(locale, "/tools")} className="hover:text-text-primary transition-colors">
              {isRu ? "Инструменты" : "Tools"}
            </Link>
            <span>/</span>
            <span className="text-text-primary">{localizedCat.name}</span>
          </nav>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] border border-border bg-canvas font-mono text-xl text-accent">
              {CATEGORY_ICONS[cat.slug] ?? "→"}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary md:text-3xl">{heading}</h1>
              <p className="mt-1 max-w-2xl text-text-muted">{localizedCat.description}</p>
              <div className="mt-3 flex gap-4 text-sm text-text-muted">
                <span>
                  <span className="font-semibold text-text-primary">{implemented.length}</span>
                  {" "}{isRu ? "доступно" : "available"}
                </span>
                {coming.length > 0 && (
                  <span>
                    <span className="font-semibold text-text-primary">{coming.length}</span>
                    {" "}{isRu ? "скоро" : "coming soon"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Available tools */}
        {implemented.length > 0 && (
          <section>
            <h2 className="mb-5 text-base font-semibold text-text-primary">
              {isRu ? "Доступные инструменты" : "Available Tools"}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger">
              {implemented.map((tool) => (
                <div key={tool.slug} className="animate-fade-in">
                  <ToolCard tool={tool} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Coming soon */}
        {coming.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-5 text-base font-semibold text-text-muted">
              {isRu ? "В разработке" : "Coming Soon"}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {coming.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </section>
        )}

        {/* Related categories */}
        {relatedCats.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-base font-semibold text-text-primary">
              {isRu ? "Похожие категории" : "Related Categories"}
            </h2>
            <div className="flex flex-wrap gap-3">
              {relatedCats.map((rc) => {
                const count = allTools.filter((t) => t.category === rc.slug && t.isImplemented).length;
                return (
                  <Link
                    key={rc.slug}
                    href={localePath(locale, `/categories/${rc.slug}`)}
                    className="flex items-center gap-2 rounded-[10px] border border-border bg-surface px-4 py-2.5 text-sm hover:border-accent/40 hover:bg-surface-hover transition-colors"
                  >
                    <span className="font-mono text-accent">{CATEGORY_ICONS[rc.slug]}</span>
                    <span className="text-text-primary">{rc.name}</span>
                    <span className="text-xs text-text-muted">{count}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
