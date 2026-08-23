import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { locales, isLocale, defaultLocale, Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { AuthProvider } from "@/lib/auth/auth-context";
import { DictProvider } from "@/lib/i18n/dict-context";
import { ToastProvider } from "@/components/ui/Toast";
import { ThemeProvider } from "@/components/ThemeProvider";
import { siteConfig } from "@/lib/seo";
import { LangSetter } from "@/components/LangSetter";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);
  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: `${siteConfig.name} — ${dict.site.tagline}`,
      template: `%s | ${siteConfig.name}`,
    },
    description: dict.site.description,
    openGraph: {
      title: siteConfig.name,
      description: dict.site.description,
      url: siteConfig.url,
      siteName: siteConfig.name,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: siteConfig.name,
      description: dict.site.description,
    },
  };
}

/**
 * Locale layout — nested inside the root app/layout.tsx.
 * Does NOT render <html> or <body> — those live in the root layout.
 * Sets the lang attribute via a small client component (LangSetter) so
 * screen readers and search engines see the correct language per route.
 */
export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const rawLocale = params?.locale ?? defaultLocale;
  if (!isLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;
  const dict = getDictionary(locale);

  return (
    <AuthProvider>
      <DictProvider dict={dict} locale={locale}>
        <ToastProvider>
          <ThemeProvider>
          {/* Sets document.documentElement.lang on the client after hydration */}
          <LangSetter lang={locale} />
          <Header />
          <main>{children}</main>
          <Footer />
          </ThemeProvider>
        </ToastProvider>
      </DictProvider>
    </AuthProvider>
  );
}