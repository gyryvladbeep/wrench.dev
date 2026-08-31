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
  const { user } = useAuth();
  const prevUser = useRef<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("wrench_accent");
    applyAndSaveAccent(saved ?? DEFAULT.value);
  }, []);

  useEffect(() => {
    const wasLoggedIn = prevUser.current !== null;
    const isLoggedIn  = user !== null;

    if (wasLoggedIn && !isLoggedIn) {
      applyAndSaveAccent(DEFAULT.value);
      prevUser.current = null;
      return;
    }

    if (isLoggedIn && user) {
      prevUser.current = user.id;
      const supabase = createClient();
      supabase.from("profiles")
        .select("avatar_color")
        .eq("id", user.id)
        .single()
        .then(({ data }: { data: { avatar_color: string } | null }) => {
          if (data?.avatar_color) applyAndSaveAccent(data.avatar_color);
        });
    }
  }, [user]);

  return <>{children}</>;
}