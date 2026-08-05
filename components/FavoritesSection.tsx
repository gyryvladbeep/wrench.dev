"use client";

import Link from "next/link";
import { useDict } from "@/lib/i18n/dict-context";
import { useFavorites } from "@/lib/hooks/useFavorites";
import { getToolBySlug } from "@/lib/tools-registry";
import { localePath } from "@/lib/i18n/config";
import { localizeTool } from "@/lib/i18n/localize";
import { FavoriteButton } from "@/components/FavoriteButton";

export function FavoritesSection() {
  const { locale } = useDict();
  const { favorites, hydrated } = useFavorites();

  if (!hydrated || favorites.length === 0) return null;

  const tools = favorites
    .map((slug) => getToolBySlug(slug))
    .filter(Boolean)
    .map((t) => localizeTool(t!, locale));

  if (tools.length === 0) return null;

  const heading = locale === "ru" ? "⭐ Избранное" : "⭐ Favorites";

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-lg font-semibold text-text-primary">{heading}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link
            key={tool.slug}
            href={localePath(locale, `/tools/${tool.slug}`)}
            className="group flex items-start justify-between gap-2 rounded-[10px] border border-border bg-surface p-4 transition-all hover:border-accent/30 hover:bg-surface-hover"
          >
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors truncate">{tool.name}</h3>
              <p className="mt-1 text-xs text-text-muted line-clamp-2">{tool.shortDescription}</p>
            </div>
            <FavoriteButton slug={tool.slug} />
          </Link>
        ))}
      </div>
    </section>
  );
}
