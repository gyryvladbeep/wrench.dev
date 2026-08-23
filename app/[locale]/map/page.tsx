import { Metadata } from "next";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import { buildPageMetadata } from "@/lib/seo";
import { ToolMapClient } from "@/components/ToolMapClient";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const isRu   = locale === "ru";
  return buildPageMetadata(locale, "/map",
    isRu ? "Карта инструментов — Wrench-Branch" : "Tool Map — Wrench-Branch",
    isRu ? "Интерактивная карта всех инструментов платформы." : "Interactive map of all tools on the platform."
  );
}

export default function MapPage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  return (
    <div className="h-[calc(100vh-48px)] overflow-hidden">
      <ToolMapClient locale={locale} />
    </div>
  );
}