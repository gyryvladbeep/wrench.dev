import type { Metadata } from "next";
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
      </body>
    </html>
  );
}
