import type { Metadata } from "next";
import { Unbounded, Manrope } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { siteConfig } from "@/lib/seo";
import "./globals.css";

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

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: "Fast, privacy-friendly developer tools for formatting, encoding, generating and debugging. All tools run in your browser.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.tagline,
    url: siteConfig.url,
    siteName: siteConfig.name,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: siteConfig.name,
    description: siteConfig.tagline,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // lang="en" — этот layout стоит НАД [locale] и физически не может
    // знать реальную локаль запроса (params.locale сюда не доходит): дать
    // ему точный lang можно только прочитав заголовок из middleware через
    // headers(), а это в Next.js официально "Dynamic API" — как только он
    // используется в корневом layout, ВЕСЬ сайт перестаёт статически
    // генерироваться и рендерится заново на каждый запрос (все страницы
    // инструментов, категорий, базы знаний теряют статическую отдачу).
    // Сознательный компромисс: en — дефолтная локаль сайта (та же, что
    // x-default в lib/seo.ts), а для ru-страниц <LangSetter> ниже по
    // дереву донастраивает атрибут сразу после гидратации — за счёт
    // suppressHydrationWarning ниже это не вызывает предупреждений React.
    <html lang="en" suppressHydrationWarning className={`dark ${heading.variable} ${body.variable}`}>
      <body className="min-h-screen bg-canvas font-sans text-text-primary antialiased">
        {/*
          Космический фон — декоративный слой позади всего сайта (см.
          .cosmic-bg в globals.css). Один div на корневой layout, а не
          per-page — по требованию "по всему сайту одинаково тихо".
          aria-hidden — чисто визуальный элемент, ничего не сообщает
          скринридерам.
        */}
        <div className="cosmic-bg" aria-hidden="true" />
        {children}
        {/*
          Vercel Analytics — без cookie, без кросс-сайтового трекинга,
          агрегирует только базовые метрики (страницы, referrer, страна
          по IP, который сразу же анонимизируется). Ставим один раз в
          корневом layout (а не в [locale]/layout.tsx), чтобы считать
          визиты по всем локалям сразу, а не задваивать логику.
          Важно: до этой правки в /privacy было написано "мы используем
          privacy-friendly, cookie-free аналитику" — а по факту в коде
          не было НИКАКОЙ аналитики. Теперь это утверждение стало правдой.
        */}
        <Analytics />
      </body>
    </html>
  );
}
