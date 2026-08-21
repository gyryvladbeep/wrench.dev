import { MetadataRoute } from "next";
import { allTools, categories } from "@/lib/tools-registry";
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
    pages.push(url(localePath(locale, "/docs"), 0.5, "monthly"));
    pages.push(url(localePath(locale, "/privacy"), 0.3, "yearly"));
    pages.push(url(localePath(locale, "/terms"), 0.3, "yearly"));
    pages.push(url(localePath(locale, "/contact"), 0.3, "yearly"));
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
  }
  return pages;
}
