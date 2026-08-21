"use client";
import { useState, useEffect, useCallback } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) setValue(JSON.parse(item));
    } catch {}
    setHydrated(true);

    function onStorage(e: StorageEvent) {
      if (e.key === key && e.newValue !== null) {
        try { setValue(JSON.parse(e.newValue)); } catch {}
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);

  const set = useCallback((next: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      try {
        const serialized = JSON.stringify(resolved);
        window.localStorage.setItem(key, serialized);
        window.dispatchEvent(new StorageEvent("storage", { key, newValue: serialized }));
      } catch {}
      return resolved;
    });
  }, [key]);

  return [value, set, hydrated] as const;
}