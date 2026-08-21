import { Metadata } from "next";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import { buildPageMetadata } from "@/lib/seo";
import { PlaygroundClient } from "@/components/playground/PlaygroundClient";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const isRu   = locale === "ru";
  return buildPageMetadata(locale, "/playground",
    isRu ? "Playground — Wrench-Branch" : "Playground — Wrench-Branch",
    isRu ? "Браузерная песочница для JavaScript, JSON, regex и SQL." : "Browser-based sandbox for JavaScript, JSON, regex and SQL."
  );
}

export default function PlaygroundPage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  return <PlaygroundClient locale={locale} />;
}
