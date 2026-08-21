import { Metadata } from "next";
import { notFound } from "next/navigation";
import { allTools, getToolBySlug, getRelatedTools, getCategoryBySlug } from "@/lib/tools-registry";
import { isLocale, defaultLocale, locales } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizeTool, localizeTools, localizeCategory } from "@/lib/i18n/localize";
import { buildToolMetadata, buildToolJsonLd } from "@/lib/seo";
import { ToolLayout } from "@/components/ToolLayout";
import { JsonLd } from "@/components/JsonLd";
import { ToolRenderer } from "@/components/tools/ToolRenderer";

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    allTools.map((tool) => ({ locale, slug: tool.slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const tool = getToolBySlug(params.slug);
  if (!tool) return {};
  return buildToolMetadata(localizeTool(tool, locale), locale);
}

export default function ToolPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);

  const tool = getToolBySlug(params.slug);
  if (!tool) notFound();

  const localizedTool = localizeTool(tool, locale);
  const related = localizeTools(getRelatedTools(tool), locale);
  const category = getCategoryBySlug(tool.category);
  const localizedCategory = category ? localizeCategory(category, locale) : null;
  const categoryName = localizedCategory?.name ?? tool.category;

  return (
    <>
      <JsonLd data={buildToolJsonLd(localizedTool, locale, categoryName, dict.toolLayout.home)} />
      <ToolLayout
        tool={localizedTool}
        locale={locale}
        dict={dict}
        categoryName={categoryName}
        related={related}
      >
        {/* ToolRenderer is a single "use client" boundary — the server passes
            only serializable data (slug, dict, locale, tool metadata), and
            the component itself selects which interactive widget to render. */}
        <ToolRenderer
          slug={tool.slug}
          tool={localizedTool}
          dict={dict}
          locale={locale}
        />
      </ToolLayout>
    </>
  );
}
