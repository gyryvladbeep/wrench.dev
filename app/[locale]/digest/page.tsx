import { Metadata } from "next";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import { buildPageMetadata } from "@/lib/seo";
import { DigestClient } from "@/components/digest/DigestClient";

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const isRu   = locale === "ru";
  return buildPageMetadata(locale, "/digest",
    isRu ? "Дневной дайджест — Wrench-Branch" : "Daily Digest — Wrench-Branch",
    isRu
      ? "Сегодняшние челленджи, инструмент дня, факт дня и зал славы по стрикам — в ироничном тоне, без ИИ."
      : "Today's challenges, tool of the day, a fact of the day, and a streak hall of fame — in an ironic tone, no AI involved."
  );
}

export default async function DigestPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  return <DigestClient locale={locale} />;
}
