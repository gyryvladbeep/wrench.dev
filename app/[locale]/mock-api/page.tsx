import { Metadata } from "next";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import { buildPageMetadata } from "@/lib/seo";
import { MockApiClient } from "@/components/mock-api/MockApiClient";

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const isRu   = locale === "ru";
  return buildPageMetadata(locale, "/mock-api",
    isRu ? "Mock API / Test-песочница — Wrench-Branch" : "Mock API / Test Sandbox — Wrench-Branch",
    isRu
      ? "Создай публичный mock-эндпоинт с заданным статусом, телом ответа и задержкой — для своих тестов и CI."
      : "Spin up a public mock endpoint with a fixed status, response body and delay — for your tests and CI."
  );
}

export default async function MockApiPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  return <MockApiClient locale={locale} />;
}
