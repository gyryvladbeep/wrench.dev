import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ARTICLES, getArticleBySlug } from "@/lib/knowledge/articles";
import { isLocale, defaultLocale, locales } from "@/lib/i18n/config";
import { buildArticleMetadata, buildArticleJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { ArticleLayout } from "@/components/knowledge/ArticleLayout";

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    ARTICLES.map((article) => ({ locale, slug: article.slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const article = getArticleBySlug(params.slug);
  if (!article) return {};
  return buildArticleMetadata(article, locale);
}

export default function ArticlePage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const isRu   = locale === "ru";

  const article = getArticleBySlug(params.slug);
  if (!article) notFound();

  return (
    <>
      <JsonLd data={buildArticleJsonLd(
        article,
        locale,
        isRu ? "Главная" : "Home",
        isRu ? "База знаний" : "Knowledge"
      )} />
      <ArticleLayout article={article} locale={locale} />
    </>
  );
}
