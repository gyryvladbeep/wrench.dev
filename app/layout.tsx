import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { siteConfig } from "@/lib/seo";
import "./globals.css";

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
    <html suppressHydrationWarning className="dark">
      <body className="min-h-screen bg-canvas font-sans text-text-primary antialiased">
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