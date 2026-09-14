"use client";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";

export const THEME_COLORS = [
  { label:"Amber",    labelRu:"Янтарный",    value:"#f59e0b", fg:"#09090b", rgb:"245 158 11",  fgRgb:"9 9 11"   },
  { label:"Blue",     labelRu:"Синий",       value:"#3b82f6", fg:"#ffffff", rgb:"59 130 246",  fgRgb:"255 255 255" },
  { label:"Violet",   labelRu:"Фиолетовый",  value:"#8b5cf6", fg:"#ffffff", rgb:"139 92 246",  fgRgb:"255 255 255" },
  { label:"Green",    labelRu:"Зелёный",     value:"#22c55e", fg:"#09090b", rgb:"34 197 94",   fgRgb:"9 9 11"   },
  { label:"Red",      labelRu:"Красный",     value:"#ef4444", fg:"#ffffff", rgb:"239 68 68",   fgRgb:"255 255 255" },
  { label:"Cyan",     labelRu:"Циановый",    value:"#06b6d4", fg:"#09090b", rgb:"6 182 212",   fgRgb:"9 9 11"   },
  { label:"Pink",     labelRu:"Розовый",     value:"#ec4899", fg:"#ffffff", rgb:"236 72 153",  fgRgb:"255 255 255" },
  { label:"Orange",   labelRu:"Оранжевый",   value:"#f97316", fg:"#09090b", rgb:"249 115 22",  fgRgb:"9 9 11"   },
  { label:"Lime",     labelRu:"Лаймовый",    value:"#84cc16", fg:"#09090b", rgb:"132 204 22",  fgRgb:"9 9 11"   },
  { label:"White",    labelRu:"Белый",       value:"#e4e4e7", fg:"#09090b", rgb:"228 228 231", fgRgb:"9 9 11"   },
];

const DEFAULT = THEME_COLORS[0];

export function applyAndSaveAccent(value: string, save = true) {
  const theme = THEME_COLORS.find(c => c.value === value) ?? DEFAULT;
  const root  = document.documentElement;
  // Set both hex (for inline styles) and RGB (for Tailwind opacity modifiers)
  root.style.setProperty("--accent",       theme.value);
  root.style.setProperty("--accent-fg",    theme.fg);
  root.style.setProperty("--accent-rgb",   theme.rgb);
  root.style.setProperty("--accent-fg-rgb", theme.fgRgb);
  if (save) localStorage.setItem("wrench_accent", value);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  // Tracks *whose* saved color is currently applied, not just "did we run
  // once" — lets the effect below tell "still the same signed-in user" apart
  // from "a different user" (switched accounts) or "genuinely logged out",
  // and re-fetch exactly when it should.
  const appliedForUserId = useRef<string | null>(null);

  // Paint whatever's cached locally the instant the app mounts, so there's
  // no flash of the wrong color while the auth session is still resolving
  // (save=false — this is just replaying a previous save, not a new choice).
  useEffect(() => {
    const saved = localStorage.getItem("wrench_accent");
    applyAndSaveAccent(saved ?? DEFAULT.value, false);
  }, []);

  useEffect(() => {
    // ═══════════════════════════════════════════════════════════════
    // Почему ждём именно loading, а не реагируем сразу на user
    // ═══════════════════════════════════════════════════════════════
    // Та же гонка состояний, что уже один раз ловили и задокументировали
    // в app/[locale]/profile/page.tsx: user в AuthProvider изначально
    // равен null — и ДО того как сессия проверена, и ПОСЛЕ подтверждения
    // "ты правда разлогинен" — это одно и то же значение null. Раньше
    // этот эффект был завязан только на [user], поэтому если бы React
    // успел прогнать его до того, как getSession()/onAuthStateChange
    // отработали (особенно вероятно сразу после полного релоада страницы,
    // который и происходит на возврате из OAuth-редиректа Google/GitHub),
    // эффект просто не перезапускался бы заново, как только user
    // становился настоящим значением, — акцент так и оставался бы
    // дефолтным (жёлтым), несмотря на реально сохранённый в БД цвет.
    // loading меняется ровно один раз: true → false, именно в момент,
    // когда AuthProvider узнал точный ответ — гарантированная смена
    // значения, на которую React обязательно перезапустит эффект.
    if (loading) return;

    if (!user) {
      if (appliedForUserId.current !== null) applyAndSaveAccent(DEFAULT.value);
      appliedForUserId.current = null;
      return;
    }

    // Уже применили сохранённый цвет для этого же пользователя в этой
    // сессии — не гонять запрос повторно на каждый лишний ре-рендер
    // (например, из-за обновления токена, которое меняет ссылку на
    // объект user, но не самого пользователя).
    if (appliedForUserId.current === user.id) return;
    appliedForUserId.current = user.id;

    const supabase = createClient();
    supabase.from("profiles")
      .select("avatar_color")
      .eq("id", user.id)
      // .maybeSingle() вместо .single() — не считает отсутствие строки
      // ошибкой (на случай, если строка профиля ещё не успела
      // создаться к этому моменту), плюс ниже теперь реально проверяем
      // error, а не молча его игнорируем, как было раньше — раньше сбой
      // этого запроса был неотличим от "у пользователя просто нет
      // сохранённого цвета", и акцент так и оставался жёлтым без единого
      // следа в консоли, почему.
      .maybeSingle()
      .then(({ data, error }: { data: { avatar_color: string } | null; error: { message: string } | null }) => {
        if (error) {
          console.error("ThemeProvider: failed to load saved accent color", error);
          return;
        }
        if (data?.avatar_color) applyAndSaveAccent(data.avatar_color);
      });
  }, [user, loading]);

  return <>{children}</>;
}
