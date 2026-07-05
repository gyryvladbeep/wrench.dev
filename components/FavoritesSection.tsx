"use client";

import Link from "next/link";
import { useDict } from "@/lib/i18n/dict-context";
import { useFavorites } from "@/lib/hooks/useFavorites";
import { getToolBySlug } from "@/lib/tools-registry";
import { localePath } from "@/lib/i18n/config";
import { localizeTool } from "@/lib/i18n/localize";
import { FavoriteButton } from "@/components/FavoriteButton";
import { Card } from "@/components/ui/card";

export function FavoritesSection() {
  const { locale } = useDict();
  const { favorites, hydrated } = useFavorites();

  if (!hydrated || favorites.length === 0) return null;

  const tools = favorites
    .map((slug) => getToolBySlug(slug))
    .filter(Boolean)
    .map((t) => localizeTool(t!, locale));

  if (tools.length === 0) return null;

  const heading = locale === "ru" ? "Избранное" : "Favorites";

  return (
    <section className="mt-8">
      <h2 className="mb-4 text-lg font-medium text-text-primary">★ {heading}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link key={tool.slug} href={localePath(locale, `/tools/${tool.slug}`)} className="block focus-visible:outline-none">
            <Card className="h-full transition-colors hover:bg-surface-hover">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-text-primary">{tool.name}</h3>
                <FavoriteButton slug={tool.slug} />
              </div>
              <p className="mt-2 text-sm text-text-muted">{tool.shortDescription}</p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
