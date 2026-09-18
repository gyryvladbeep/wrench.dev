import { MetadataRoute } from "next";
import { allTools, categories } from "@/lib/tools-registry";
import { ARTICLES } from "@/lib/knowledge/articles";
import { siteConfig } from "@/lib/seo";
import { locales, localePath } from "@/lib/i18n/config";

function url(path: string, priority: number, freq: string): MetadataRoute.Sitemap[number] {
  return {
    url: `${siteConfig.url}${path}`,
    priority,
    changeFrequency: freq as MetadataRoute.Sitemap[number]["changeFrequency"],
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [];
  for (const locale of locales) {
    pages.push(url(localePath(locale, "/"), 1, "weekly"));
    pages.push(url(localePath(locale, "/tools"), 0.9, "weekly"));
    pages.push(url(localePath(locale, "/knowledge"), 0.8, "weekly"));
    pages.push(url(localePath(locale, "/docs"), 0.5, "monthly"));
    pages.push(url(localePath(locale, "/privacy"), 0.3, "yearly"));
    pages.push(url(localePath(locale, "/terms"), 0.3, "yearly"));
    pages.push(url(localePath(locale, "/contact"), 0.3, "yearly"));

    // These standalone features had page.tsx routes and real internal links
    // (header, footer) but were never added here, so the sitemap has been
    // quietly missing about a third of the site's public pages. /workbench
    // itself is deliberately left out — it renders nothing and redirects to
    // /auth/login for a signed-out visitor (same as /profile), so it isn't
    // a page worth asking a crawler to index; /workbench/gallery is the
    // public, unauthenticated part of that feature and belongs here instead.
    pages.push(url(localePath(locale, "/challenges"), 0.8, "daily"));
    for (const role of ["qa", "frontend", "backend"] as const) {
      pages.push(url(localePath(locale, `/challenges/${role}`), 0.7, "daily"));
    }
    pages.push(url(localePath(locale, "/workbench/gallery"), 0.6, "weekly"));
    pages.push(url(localePath(locale, "/trainer"), 0.7, "weekly"));
    pages.push(url(localePath(locale, "/interview"), 0.7, "weekly"));
    pages.push(url(localePath(locale, "/playground"), 0.6, "weekly"));
    pages.push(url(localePath(locale, "/salary"), 0.7, "weekly"));
    pages.push(url(localePath(locale, "/salary/report"), 0.7, "daily"));
    pages.push(url(localePath(locale, "/leaderboard"), 0.6, "daily"));
    pages.push(url(localePath(locale, "/mock-api"), 0.6, "monthly"));
    pages.push(url(localePath(locale, "/webhook-inspector"), 0.6, "monthly"));
    pages.push(url(localePath(locale, "/digest"), 0.5, "daily"));
    pages.push(url(localePath(locale, "/people"), 0.6, "weekly"));
    pages.push(url(localePath(locale, "/pro"), 0.6, "monthly"));
    pages.push(url(localePath(locale, "/map"), 0.5, "monthly"));

    for (const c of categories) {
      pages.push(url(localePath(locale, `/categories/${c.slug}`), 0.8, "weekly"));
    }
    for (const t of allTools) {
      pages.push(url(
        localePath(locale, `/tools/${t.slug}`),
        t.isPopular ? 0.9 : t.isFeatured ? 0.8 : 0.6,
        "monthly"
      ));
    }
    for (const a of ARTICLES) {
      pages.push(url(localePath(locale, `/knowledge/${a.slug}`), 0.7, "monthly"));
    }
  }
  return pages;
}
