import { Metadata } from "next";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import { buildPageMetadata } from "@/lib/seo";
import { KnowledgeClient } from "@/components/knowledge/KnowledgeClient";

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const isRu   = locale === "ru";
  return buildPageMetadata(locale, "/knowledge",
    isRu ? "База знаний — Wrench-Branch" : "Knowledge Base — Wrench-Branch",
    isRu ? "Статьи, roadmap-ы и ресурсы для QA, Frontend и Backend разработчиков." : "Articles, roadmaps and resources for QA, Frontend and Backend developers."
  );
}

export default async function KnowledgePage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  return <KnowledgeClient locale={locale} />;
}