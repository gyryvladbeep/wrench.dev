"use client";
import Link from "next/link";
import { useDict } from "@/lib/i18n/dict-context";
import { useFavorites } from "@/lib/hooks/useFavorites";
import { getToolBySlug } from "@/lib/tools-registry";
import { localePath } from "@/lib/i18n/config";
import { localizeTool } from "@/lib/i18n/localize";
import { FavoriteButton } from "@/components/FavoriteButton";
import { CategoryIcon } from "@/components/CategoryIcon";

export function FavoritesSection() {
  const { locale } = useDict();
  const { favorites, hydrated } = useFavorites();
  if (!hydrated || favorites.length === 0) return null;
  const tools = favorites.map((s) => getToolBySlug(s)).filter(Boolean).map((t) => localizeTool(t!, locale));
  if (tools.length === 0) return null;
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-base font-semibold text-text-primary">{locale === "ru" ? "Избранное" : "Favorites"}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link key={tool.slug} href={localePath(locale, `/tools/${tool.slug}`)}
            className="group flex items-start justify-between gap-2 rounded-lg border border-border bg-surface p-4 transition-all hover:border-accent/30 hover:bg-surface-hover">
            <div className="flex items-start gap-2.5 min-w-0">
              <span className="mt-0.5 shrink-0 text-text-muted/50 group-hover:text-accent transition-colors">
                <CategoryIcon category={tool.category} size={13} />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors truncate">{tool.name}</h3>
                <p className="mt-0.5 text-xs text-text-muted line-clamp-2">{tool.shortDescription}</p>
              </div>
            </div>
            <FavoriteButton slug={tool.slug} />
          </Link>
        ))}
      </div>
    </section>
  );
}
