import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { categories, getCategoryBySlug, getToolsByCategory } from "@/lib/tools-registry";
import { isLocale, defaultLocale, locales, localePath } from "@/lib/i18n/config";
import { ToolCategory } from "@/lib/types";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizeTools, localizeCategory } from "@/lib/i18n/localize";
import { buildCategoryMetadata } from "@/lib/seo";
import { categoryHeading } from "@/lib/i18n/format";
import { ToolCard } from "@/components/ToolCard";

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    categories.map((c) => ({ locale, category: c.slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; category: string };
}): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);
  const cat = getCategoryBySlug(params.category as ToolCategory);
  if (!cat) return {};
  const localized = localizeCategory(cat, locale);
  return buildCategoryMetadata(
    locale,
    cat.slug,
    categoryHeading(localized.name, locale),
    localized.description
  );
}

export default function CategoryPage({
  params,
}: {
  params: { locale: string; category: string };
}) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);
  const t = dict.categoryPage;

  const cat = getCategoryBySlug(params.category as ToolCategory);
  if (!cat) notFound();

  const localizedCat = localizeCategory(cat, locale);
  const tools = localizeTools(getToolsByCategory(cat.slug), locale);
  const heading = categoryHeading(localizedCat.name, locale);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-text-muted">
        <Link href={localePath(locale, "/")} className="hover:text-text-primary">{t.home}</Link>
        {" / "}
        <span className="text-text-primary">{localizedCat.name}</span>
      </nav>
      <h1 className="text-2xl font-semibold text-text-primary md:text-3xl">{heading}</h1>
      <p className="mt-2 max-w-2xl text-text-muted">{localizedCat.description}</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} locale={locale} dict={dict} />
        ))}
      </div>
    </div>
  );
}
