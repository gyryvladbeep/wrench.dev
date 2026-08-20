import { Metadata } from "next";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";
import { getToolBySlug, getRelatedTools, getCategoryBySlug } from "@/lib/tools-registry";
import { localizeTool, localizeTools, localizeCategory } from "@/lib/i18n/localize";
import { ToolLayout } from "@/components/ToolLayout";
import { TestCaseGeneratorClient } from "@/components/tools/TestCaseGeneratorClient";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const isRu   = locale === "ru";
  return buildPageMetadata(
    locale,
    "/tools/test-case-generator",
    isRu ? "Генератор тест-кейсов AI — Wrench-Branch" : "AI Test Case Generator — Wrench-Branch",
    isRu
      ? "Генерируйте профессиональные тест-кейсы из user story за секунды. Поддержка Markdown, Gherkin, JSON. Бесплатно."
      : "Generate professional test cases from user stories in seconds. Supports Markdown, Gherkin, JSON. Free."
  );
}

export default function TestCaseGeneratorPage({ params }: { params: { locale: string } }) {
  const locale  = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict    = getDictionary(locale);
  const tool    = getToolBySlug("test-case-generator");
  if (!tool) return null;
  const locTool = localizeTool({ ...tool, isImplemented: true }, locale);
  const related = localizeTools(getRelatedTools(tool), locale);
  const cat     = getCategoryBySlug(tool.category)!;
  const locCat  = localizeCategory(cat, locale);

  return (
    <ToolLayout tool={locTool} locale={locale} dict={dict} categoryName={locCat.name} related={related}>
      <TestCaseGeneratorClient locale={locale} />
    </ToolLayout>
  );
}
