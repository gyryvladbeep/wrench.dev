import { Metadata } from "next";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import { buildPageMetadata } from "@/lib/seo";
import { WebhookInspectorClient } from "@/components/webhook-inspector/WebhookInspectorClient";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const isRu   = locale === "ru";
  return buildPageMetadata(locale, "/webhook-inspector",
    isRu ? "Webhook Inspector — Wrench-Branch" : "Webhook Inspector — Wrench-Branch",
    isRu
      ? "Получи публичный URL и лови на него реальные вебхуки — метод, заголовки, query и тело каждого запроса видны сразу."
      : "Get a public URL and capture real webhooks sent to it — method, headers, query and body for every request, right away."
  );
}

export default function WebhookInspectorPage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  return <WebhookInspectorClient locale={locale} />;
}
