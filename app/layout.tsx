import type { Metadata } from "next";
import { siteConfig } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — Essential tools for Developers`,
    template: `%s | ${siteConfig.name}`,
  },
  description: "Fast, free developer tools for formatting, encoding, generating and debugging.",
  icons: {
    icon: "/favicon.svg",
  },
};

/**
 * Root layout — required by Next.js App Router.
 * Renders <html> and <body> exactly once.
 *
 * suppressHydrationWarning on <html> is intentional: the locale-specific
 * layout sets lang={locale} via a client component after hydration, which
 * causes a controlled mismatch on the attribute only — not in the content.
 *
 * All providers (AuthProvider, DictProvider) and site chrome (Header, Footer)
 * live in app/[locale]/layout.tsx so they have access to the locale param.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning className="dark">
      <body className="min-h-screen bg-canvas font-sans text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
