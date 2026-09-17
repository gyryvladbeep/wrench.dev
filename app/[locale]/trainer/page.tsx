import { Metadata } from "next";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import { buildPageMetadata } from "@/lib/seo";
import { TrainerClient } from "@/components/trainer/TrainerClient";

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const isRu   = locale === "ru";
  return buildPageMetadata(locale, "/trainer",
    isRu ? "Тренажёр кода — Wrench-Branch" : "Code Trainer — Wrench-Branch",
    isRu
      ? "Короткие упражнения на JavaScript с автоматической проверкой — пиши функцию, запускай тесты, смотри результат сразу в браузере."
      : "Short JavaScript exercises with automatic checking — write a function, run the tests, see the result right in your browser."
  );
}

export default async function TrainerPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  return <TrainerClient locale={locale} />;
}
