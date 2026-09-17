import { Metadata } from "next";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import { buildPageMetadata } from "@/lib/seo";
import { InterviewPrepClient } from "@/components/interview/InterviewPrepClient";

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const isRu   = locale === "ru";
  return buildPageMetadata(locale, "/interview",
    isRu ? "Interview Prep — Wrench-Branch" : "Interview Prep — Wrench-Branch",
    isRu ? "Вопросы для технических интервью: QA, Frontend, Backend. Junior, Middle, Senior." : "Technical interview questions: QA, Frontend, Backend. Junior, Middle, Senior levels."
  );
}

export default async function InterviewPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  return <InterviewPrepClient locale={locale} />;
}
