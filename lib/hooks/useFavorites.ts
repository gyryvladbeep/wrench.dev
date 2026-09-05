"use client";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { createClient } from "@/lib/supabase/client";
import { useLocalStorage } from "./useLocalStorage";

const KEY = "dtb_favorites";

/**
 * До этой правки избранное всегда жило ТОЛЬКО в localStorage — даже на
 * вкладке "Избранное" в /profile у залогиненных пользователей. То есть
 * оно не переживало смену браузера или устройства, хотя по смыслу это
 * фича аккаунта.
 *
 * Теперь:
 *  - без аккаунта — всё как раньше, только localStorage. Это намеренно:
 *    вся позиционировка сайта держится на "инструменты работают без
 *    регистрации", и это должно остаться правдой.
 *  - с аккаунтом — источник истины таблица `favorites` в Supabase
 *    (см. supabase/favorites-schema.sql). localStorage при этом не
 *    стирается — если человек выйдет из аккаунта, локальные отметки
 *    никуда не денутся.
 *  - при первом входе после регистрации всё, что было отмечено
 *    анонимно, докатывается в аккаунт ОДИН раз (не при каждом клике) —
 *    иначе получилось бы "зарегистрируйся и потеряй то, что уже выбрал".
 */
export function useFavorites() {
  const { user } = useAuth();
  const [localFavorites, setLocalFavorites, localHydrated] = useLocalStorage<string[]>(KEY, []);

  // null = ещё не загрузили из Supabase (или пользователь не залогинен)
  const [remoteFavorites, setRemoteFavorites] = useState<string[] | null>(null);
  const [migrated, setMigrated] = useState(false);

  useEffect(() => {
    if (!user) {
      setRemoteFavorites(null);
      setMigrated(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("favorites")
          .select("tool_slug")
          .eq("user_id", user.id);
        if (cancelled) return;

        const remoteSlugs = ((data as { tool_slug: string }[] | null) ?? []).map((r) => r.tool_slug);

        // Переносим анонимные отметки, которых ещё нет в аккаунте.
        const toMigrate = localFavorites.filter((slug) => !remoteSlugs.includes(slug));
        if (toMigrate.length > 0) {
          await supabase.from("favorites").upsert(
            toMigrate.map((tool_slug) => ({ user_id: user.id, tool_slug })),
            { onConflict: "user_id,tool_slug" }
          );
        }
        if (cancelled) return;

        setRemoteFavorites([...new Set([...remoteSlugs, ...toMigrate])]);
        setMigrated(true);
      } catch (err) {
        // Сеть отвалилась / RLS отказал — не блокируем интерфейс,
        // просто показываем пустое избранное вместо вечной загрузки.
        console.error("useFavorites: failed to load/migrate favorites", err);
        if (!cancelled) {
          setRemoteFavorites([]);
          setMigrated(true);
        }
      }
    })();

    return () => { cancelled = true; };
    // localFavorites намеренно не в зависимостях: миграция должна
    // сработать один раз при входе, а не при каждом локальном клике.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const favorites = user ? (remoteFavorites ?? []) : localFavorites;
  const hydrated = user ? migrated : localHydrated;

  const toggle = useCallback((slug: string) => {
    if (user) {
      const wasFavorite = (remoteFavorites ?? []).includes(slug);

      // Оптимистичное обновление — интерфейс реагирует сразу, не ждёт
      // ответ сервера. Если запрос ниже упадёт, в худшем случае
      // изменение не сохранится до следующей перезагрузки страницы.
      setRemoteFavorites((prev) => {
        const cur = prev ?? [];
        return wasFavorite ? cur.filter((s) => s !== slug) : [...cur, slug];
      });

      const supabase = createClient();
      const request = wasFavorite
        ? supabase.from("favorites").delete().eq("user_id", user.id).eq("tool_slug", slug)
        : supabase.from("favorites").upsert(
            { user_id: user.id, tool_slug: slug },
            { onConflict: "user_id,tool_slug" }
          );

      request.then(({ error }: { error: unknown }) => {
        if (error) console.error("useFavorites: failed to sync toggle", error);
      });
    } else {
      setLocalFavorites((prev) =>
        prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
      );
    }
  }, [user, remoteFavorites, setLocalFavorites]);

  const isFavorite = useCallback((slug: string) => favorites.includes(slug), [favorites]);

  return { favorites, toggle, isFavorite, hydrated };
}