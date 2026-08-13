import { Metadata } from "next";
import { Tool } from "./types";
import { Locale, localePath } from "./i18n/config";

export const siteConfig = {
  name: "Wrench-Branch",
  tagline: "Professional developer tools in one workspace",
  url: "https://wrench-branch.dev",
};

function buildAlternates(locale: Locale, path: string) {
  return {
    canonical: `${siteConfig.url}${localePath(locale, path)}`,
    languages: {
      en: `${siteConfig.url}${localePath("en", path)}`,
      ru: `${siteConfig.url}${localePath("ru", path)}`,
    },
  };
}

export function buildPageMetadata(locale: Locale, path: string, title: string, description: string): Metadata {
  return { title, description, alternates: buildAlternates(locale, path) };
}

export function buildToolMetadata(tool: Tool, locale: Locale): Metadata {
  const title = `${tool.name} — ${siteConfig.name}`;
  const path  = `/tools/${tool.slug}`;
  return {
    title,
    description: tool.metaDescription,
    alternates:  buildAlternates(locale, path),
    openGraph: {
      title, description: tool.metaDescription,
      url: `${siteConfig.url}${localePath(locale, path)}`,
      siteName: siteConfig.name, type: "website",
    },
    twitter: { card: "summary", title, description: tool.metaDescription },
    keywords: tool.keywords,
  };
}

export function buildCategoryMetadata(locale: Locale, categorySlug: string, title: string, description: string): Metadata {
  return buildPageMetadata(locale, `/categories/${categorySlug}`, title, description);
}

export function buildToolJsonLd(tool: Tool, locale: Locale, categoryName: string, homeLabel: string) {
  const path = `/tools/${tool.slug}`;
  const url  = `${siteConfig.url}${localePath(locale, path)}`;
  const catUrl  = `${siteConfig.url}${localePath(locale, `/categories/${tool.category}`)}`;
  const homeUrl = `${siteConfig.url}${localePath(locale, "/")}`;
  return [
    {
      "@context": "https://schema.org", "@type": "SoftwareApplication",
      name: tool.name, applicationCategory: "DeveloperApplication",
      operatingSystem: "Any (browser)", description: tool.metaDescription,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, url,
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: homeLabel, item: homeUrl },
        { "@type": "ListItem", position: 2, name: categoryName, item: catUrl },
        { "@type": "ListItem", position: 3, name: tool.name, item: url },
      ],
    },
    ...(tool.faqs?.length ? [{
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: tool.faqs.map((f) => ({
        "@type": "Question", name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    }] : []),
  ];
}
