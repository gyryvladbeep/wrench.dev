import { Metadata } from "next";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import { buildPageMetadata } from "@/lib/seo";
import { PlaygroundClient } from "@/components/playground/PlaygroundClient";

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const isRu   = locale === "ru";
  return buildPageMetadata(locale, "/playground",
    isRu ? "Playground — Wrench-Branch" : "Playground — Wrench-Branch",
    isRu ? "Браузерная песочница для JavaScript, JSON, regex и SQL." : "Browser-based sandbox for JavaScript, JSON, regex and SQL."
  );
}

export default async function PlaygroundPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  return <PlaygroundClient locale={locale} />;
}
