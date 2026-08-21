"use client";
import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";

const KEY = "dtb_favorites";

export function useFavorites() {
  const [favorites, setFavorites, hydrated] = useLocalStorage<string[]>(KEY, []);

  const toggle = useCallback((slug: string) => {
    setFavorites((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }, [setFavorites]);

  const isFavorite = useCallback((slug: string) => favorites.includes(slug), [favorites]);

  return { favorites, toggle, isFavorite, hydrated };
}
