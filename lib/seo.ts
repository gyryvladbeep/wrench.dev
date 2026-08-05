import { Metadata } from "next";
import { Tool } from "./types";
import { Locale, localePath } from "./i18n/config";

export const siteConfig = {
  name: "Dev Toolbox",
  // Replace with the real production domain before deploying.
  url: "https://devtoolbox.example.com",
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

/** Generic page metadata helper (docs/privacy/terms/contact/tools-index) —
 *  every static page just needs correct canonical + hreflang alternates,
 *  the title/description text itself comes from the page's own dict. */
export function buildPageMetadata(
  locale: Locale,
  path: string,
  title: string,
  description: string
): Metadata {
  return {
    title,
    description,
    alternates: buildAlternates(locale, path),
  };
}

export function buildToolMetadata(tool: Tool, locale: Locale): Metadata {
  const title = `${tool.name} — Free Online Tool | ${siteConfig.name}`;
  const path = `/tools/${tool.slug}`;
  return {
    title,
    description: tool.metaDescription,
    alternates: buildAlternates(locale, path),
    openGraph: {
      title,
      description: tool.metaDescription,
      url: `${siteConfig.url}${localePath(locale, path)}`,
      siteName: siteConfig.name,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description: tool.metaDescription,
    },
    keywords: tool.keywords,
  };
}

export function buildCategoryMetadata(locale: Locale, categorySlug: string, title: string, description: string): Metadata {
  return buildPageMetadata(locale, `/categories/${categorySlug}`, title, description);
}

/** SoftwareApplication + BreadcrumbList + (optional) FAQPage JSON-LD for a
 *  tool page. categoryName/homeLabel are passed in already-localized since
 *  this module has no dictionary access of its own. */
export function buildToolJsonLd(
  tool: Tool,
  locale: Locale,
  categoryName: string,
  homeLabel: string
) {
  const path = `/tools/${tool.slug}`;
  const url = `${siteConfig.url}${localePath(locale, path)}`;
  const categoryUrl = `${siteConfig.url}${localePath(locale, `/categories/${tool.category}`)}`;
  const homeUrl = `${siteConfig.url}${localePath(locale, "/")}`;

  const softwareApplication = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any (runs in browser)",
    description: tool.metaDescription,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    url,
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: homeLabel, item: homeUrl },
      { "@type": "ListItem", position: 2, name: categoryName, item: categoryUrl },
      { "@type": "ListItem", position: 3, name: tool.name, item: url },
    ],
  };

  const jsonLd: Record<string, unknown>[] = [softwareApplication, breadcrumb];

  if (tool.faqs && tool.faqs.length > 0) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: tool.faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    });
  }

  return jsonLd;
}
