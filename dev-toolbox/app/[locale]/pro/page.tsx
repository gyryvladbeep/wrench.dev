import { Metadata } from "next";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import { buildPageMetadata } from "@/lib/seo";
import { PricingPage } from "@/components/PricingPage";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const isRu   = locale === "ru";
  return buildPageMetadata(locale, "/pro",
    isRu ? "Wrench Pro — профессиональный план" : "Wrench Pro — Professional Plan",
    isRu ? "Безлимитные AI-генерации, архив задач, приоритетная поддержка. Всего $5/мес." : "Unlimited AI generations, full challenge archive, priority support. Just $5/month."
  );
}

export default function ProPage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  return <PricingPage locale={locale} />;
}
