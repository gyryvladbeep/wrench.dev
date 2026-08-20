"use client";
import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";

const KEY = "dtb_recently_used";
const MAX = 8;

export function useRecentlyUsed() {
  const [recent, setRecent, hydrated] = useLocalStorage<string[]>(KEY, []);

  const track = useCallback((slug: string) => {
    setRecent((prev) => {
      const filtered = prev.filter((s) => s !== slug);
      return [slug, ...filtered].slice(0, MAX);
    });
  }, [setRecent]);

  return { recent, track, hydrated };
}
