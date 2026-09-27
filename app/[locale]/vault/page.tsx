import { Metadata } from "next";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import { buildPageMetadata } from "@/lib/seo";
import { VaultClient } from "@/components/vault/VaultClient";

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const isRu   = locale === "ru";
  return buildPageMetadata(locale, "/vault",
    isRu ? "Test Vault — Wrench-Branch" : "Test Vault — Wrench-Branch",
    isRu
      ? "Личная библиотека закреплённых тест-кейсов со всех инструментов Wrench — ввод, результат и метка в одном месте."
      : "Your personal library of pinned test cases from across Wrench's tools — input, result and your own label, in one place."
  );
}

export default async function VaultPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  return <VaultClient locale={locale} />;
}
