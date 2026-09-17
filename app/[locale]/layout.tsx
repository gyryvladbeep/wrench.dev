import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Unbounded, Manrope } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { OnboardingBanner } from "@/components/OnboardingBanner";
import { StreakRiskBanner } from "@/components/StreakRiskBanner";
import { locales, isLocale, defaultLocale, Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { AuthProvider } from "@/lib/auth/auth-context";
import { DictProvider } from "@/lib/i18n/dict-context";
import { ToastProvider } from "@/components/ui/Toast";
import { EasterEgg } from "@/components/EasterEgg";
import { siteConfig } from "@/lib/seo";
import "../globals.css";

// ── Шрифты ──
// Изначально в globals.css был только fallback-стек (--font-sans:
// "Inter"...) без единого реального next/font — Inter нигде фактически
// не подключался, все видели системный шрифт браузера. Теперь грузим
// два настоящих Google Fonts через next/font/google (self-hosted,
// без внешних запросов на рендере) и публикуем их как CSS-переменные,
// которые уже читает tailwind.config.ts (fontFamily.sans / .heading).
//
// Оба шрифта — вариативные (variable), поэтому weight не задаём: Next
// сам подставляет полный диапазон начертаний, а конкретную жирность
// выбираем в компонентах через обычные font-medium/font-semibold и т.д.
//
// ВАЖНО про кириллицу: Space Grotesk (изначальный кандидат на заголовки)
// на Google Fonts не имеет кириллического подмножества вообще — русские
// заголовки тихо откатывались бы на системный шрифт. Unbounded и
// Manrope оба заявляют "cyrillic" в своём subset-покрытии — сайт
// двуязычный, это было обязательным условием выбора.
const heading = Unbounded({
  subsets: ["latin", "cyrillic"],
  variable: "--font-heading",
  display: "swap",
});

const body = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  display: "swap",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);
  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: `${siteConfig.name} — ${dict.site.tagline}`,
      template: `%s | ${siteConfig.name}`,
    },
    description: dict.site.description,
    icons: { icon: "/favicon.svg" },
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
 * Locale layout — this is the effective ROOT layout for the whole site
 * (renders <html>/<body>), even though it lives one level below app/.
 *
 * Why: every real page on this site lives under app/[locale]/ (proxy.ts
 * rewrites every incoming request to /en/... or /ru/... before it reaches
 * routing), and this layout already knows the locale statically via
 * generateStaticParams — unlike app/layout.tsx, which sits ABOVE this
 * dynamic segment and would need a Dynamic API (headers()) to read the
 * locale, forcing the ENTIRE site to render dynamically on every request
 * instead of being statically generated. So <html lang> is set right here,
 * from the already-resolved static param — full correctness with zero
 * runtime/build-time cost, no client-side patch needed.
 *
 * There is deliberately no app/layout.tsx: with every real route living
 * under this segment, Next.js treats this file as the app's root layout
 * (same pattern as the official Next.js app-router i18n example). The
 * previous app/not-found.tsx (a root-level catch-all outside [locale],
 * only ever reachable for paths proxy.ts's matcher explicitly excludes —
 * missing static assets, bad /api/ paths — never a real page a user
 * navigates to) was removed as redundant with this segment's own
 * not-found.tsx, which is the one real visitors actually see.
 */
export default async function LocaleLayout(
  props: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;

  const {
    children
  } = props;

  const rawLocale = params?.locale ?? defaultLocale;
  if (!isLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;
  const dict = getDictionary(locale);

  return (
    <html lang={locale} suppressHydrationWarning className={`dark ${heading.variable} ${body.variable}`}>
      <body className="min-h-screen bg-canvas font-sans text-text-primary antialiased">
        {/*
          Космический фон — декоративный слой позади всего сайта (см.
          .cosmic-bg в globals.css). Один div на корневой layout, а не
          per-page — по требованию "по всему сайту одинаково тихо".
          aria-hidden — чисто визуальный элемент, ничего не сообщает
          скринридерам.
        */}
        <div className="cosmic-bg" aria-hidden="true" />
        <AuthProvider>
          <DictProvider dict={dict} locale={locale}>
            <ToastProvider>
              <ThemeProvider>
                <Header />
                <OnboardingBanner />
                <StreakRiskBanner />
                <main>{children}</main>
                <EasterEgg />
                <Footer dict={dict} locale={locale} />
              </ThemeProvider>
            </ToastProvider>
          </DictProvider>
        </AuthProvider>
        {/*
          Vercel Analytics — без cookie, без кросс-сайтового трекинга,
          агрегирует только базовые метрики (страницы, referrer, страна
          по IP, который сразу же анонимизируется). Раньше стоял в
          app/layout.tsx (единственный раз на все локали, не задваивая
          логику) — теперь этот layout сам единственный на все локали
          (генерируется по разу на каждую через generateStaticParams),
          так что свойство "один раз на всех" сохраняется.
        */}
        <Analytics />
      </body>
    </html>
  );
}
