import { Metadata } from "next";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import { buildPageMetadata } from "@/lib/seo";
import { KnowledgeClient } from "@/components/knowledge/KnowledgeClient";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const isRu   = locale === "ru";
  return buildPageMetadata(locale, "/knowledge",
    isRu ? "База знаний — Wrench-Branch" : "Knowledge Base — Wrench-Branch",
    isRu ? "Roadmap-ы и ресурсы для QA, Frontend и Backend разработчиков." : "Roadmaps and resources for QA, Frontend and Backend developers."
  );
}

export default function KnowledgePage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  return <KnowledgeClient locale={locale} />;
}