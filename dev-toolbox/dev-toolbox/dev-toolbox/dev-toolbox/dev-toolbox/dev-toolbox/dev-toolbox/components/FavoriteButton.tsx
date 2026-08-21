"use client";

import { useDict } from "@/lib/i18n/dict-context";
import { useFavorites } from "@/lib/hooks/useFavorites";

export function FavoriteButton({ slug }: { slug: string }) {
  const { locale } = useDict();
  const { isFavorite, toggle, hydrated } = useFavorites();

  if (!hydrated) return <span className="w-6 h-6" />;

  const active = isFavorite(slug);
  const label = active
    ? locale === "ru" ? "Убрать из избранного" : "Remove from favorites"
    : locale === "ru" ? "Добавить в избранное" : "Add to favorites";

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(slug); }}
      aria-label={label}
      title={label}
      className={`shrink-0 rounded-full p-1 text-base leading-none transition-colors ${
        active ? "text-accent hover:text-accent/70" : "text-text-muted hover:text-accent"
      }`}
    >
      {active ? "★" : "☆"}
    </button>
  );
}
