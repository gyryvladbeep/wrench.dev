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
import { CategoryIcon } from "@/components/CategoryIcon";

const RELATED: Record<string, string[]> = {
  formatting:["encoding","text"], encoding:["formatting","hash"], text:["generators","formatting"],
  hash:["encoding","api"], generators:["data","text"], datetime:["generators","api"],
  web:["api","encoding"], data:["generators","qa"], qa:["api","text"], api:["web","qa"],
};

export function generateStaticParams() {
  return locales.flatMap((locale) => categories.map((c) => ({ locale, category: c.slug })));
}

export async function generateMetadata({ params }: { params: { locale: string; category: string } }): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const cat = getCategoryBySlug(params.category as ToolCategory);
  if (!cat) return {};
  const loc = localizeCategory(cat, locale);
  return buildCategoryMetadata(locale, cat.slug, categoryHeading(loc.name, locale), loc.description);
}

export default function CategoryPage({ params }: { params: { locale: string; category: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict   = getDictionary(locale);
  const isRu   = locale === "ru";
  const cat    = getCategoryBySlug(params.category as ToolCategory);
  if (!cat) notFound();

  const loc   = localizeCategory(cat, locale);
  const tools = allTools.filter((t) => t.category === cat.slug);
  const locTools = localizeTools(tools, locale);
  const impl   = locTools.filter((t) => t.isImplemented);
  const coming = locTools.filter((t) => !t.isImplemented);
  const heading = categoryHeading(loc.name, locale);

  const relatedCats = (RELATED[cat.slug] ?? [])
    .map((s) => getCategoryBySlug(s as ToolCategory))
    .filter(Boolean)
    .map((c) => localizeCategory(c!, locale));

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="border-b border-border bg-surface/30">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <nav className="mb-4 flex items-center gap-1.5 text-xs text-text-muted">
            <Link href={localePath(locale, "/")} className="hover:text-text-primary transition-colors">{dict.toolLayout.home}</Link>
            <span>/</span>
            <Link href={localePath(locale, "/tools")} className="hover:text-text-primary transition-colors">{isRu ? "Инструменты" : "Tools"}</Link>
            <span>/</span>
            <span className="text-text-primary">{loc.name}</span>
          </nav>
          <div className="flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-canvas text-text-muted">
              <CategoryIcon category={cat.slug} size={18} />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">{heading}</h1>
              <p className="mt-1 max-w-xl text-sm text-text-muted leading-relaxed">{loc.description}</p>
              <div className="mt-3 flex gap-4 text-xs text-text-muted">
                <span><span className="font-semibold text-text-primary">{impl.length}</span> {isRu ? "доступно" : "available"}</span>
                {coming.length > 0 && <span><span className="font-semibold text-text-primary">{coming.length}</span> {isRu ? "скоро" : "coming soon"}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {impl.length > 0 && (
          <section>
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-text-muted">{isRu ? "Доступные инструменты" : "Available"}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 stagger">
              {impl.map((t) => <div key={t.slug} className="animate-fade-in"><ToolCard tool={t} /></div>)}
            </div>
          </section>
        )}
        {coming.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-text-muted">{isRu ? "В разработке" : "Coming Soon"}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {coming.map((t) => <ToolCard key={t.slug} tool={t} />)}
            </div>
          </section>
        )}
        {relatedCats.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-muted">{isRu ? "Похожие категории" : "Related Categories"}</h2>
            <div className="flex flex-wrap gap-2">
              {relatedCats.map((rc) => (
                <Link key={rc.slug} href={localePath(locale, `/categories/${rc.slug}`)}
                  className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm hover:border-accent/30 hover:bg-surface-hover transition-colors">
                  <span className="text-text-muted"><CategoryIcon category={rc.slug} size={13} /></span>
                  <span className="text-text-primary">{rc.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
