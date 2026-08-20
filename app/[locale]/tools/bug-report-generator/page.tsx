import { Metadata } from "next";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";
import { getToolBySlug, getRelatedTools, getCategoryBySlug } from "@/lib/tools-registry";
import { localizeTool, localizeTools, localizeCategory } from "@/lib/i18n/localize";
import { ToolLayout } from "@/components/ToolLayout";
import { BugReportGeneratorClient } from "@/components/tools/BugReportGeneratorClient";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const isRu   = locale === "ru";
  return buildPageMetadata(locale, "/tools/bug-report-generator",
    isRu ? "Генератор баг-репортов AI — Wrench-Branch" : "AI Bug Report Generator — Wrench-Branch",
    isRu ? "Генерируйте профессиональные баг-репорты за секунды. Markdown и Jira форматы." : "Generate professional bug reports in seconds. Markdown and Jira formats."
  );
}

export default function BugReportPage({ params }: { params: { locale: string } }) {
  const locale  = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict    = getDictionary(locale);
  const tool    = getToolBySlug("bug-report-generator");
  if (!tool) return null;
  const locTool = localizeTool({ ...tool, isImplemented: true }, locale);
  const related = localizeTools(getRelatedTools(tool), locale);
  const cat     = getCategoryBySlug(tool.category)!;
  const locCat  = localizeCategory(cat, locale);
  return (
    <ToolLayout tool={locTool} locale={locale} dict={dict} categoryName={locCat.name} related={related}>
      <BugReportGeneratorClient locale={locale} />
    </ToolLayout>
  );
}
