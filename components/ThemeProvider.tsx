"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";

export const THEME_COLORS = [
  { label:"Amber",   labelRu:"Янтарный",   value:"#f59e0b", fg:"#09090b" },
  { label:"Blue",    labelRu:"Синий",      value:"#3b82f6", fg:"#ffffff" },
  { label:"Violet",  labelRu:"Фиолетовый", value:"#8b5cf6", fg:"#ffffff" },
  { label:"Green",   labelRu:"Зелёный",    value:"#22c55e", fg:"#09090b" },
  { label:"Red",     labelRu:"Красный",    value:"#ef4444", fg:"#ffffff" },
  { label:"Cyan",    labelRu:"Циановый",   value:"#06b6d4", fg:"#09090b" },
  { label:"Pink",    labelRu:"Розовый",    value:"#ec4899", fg:"#ffffff" },
  { label:"Orange",  labelRu:"Оранжевый",  value:"#f97316", fg:"#09090b" },
  { label:"Lime",    labelRu:"Лаймовый",   value:"#84cc16", fg:"#09090b" },
  { label:"White",   labelRu:"Белый",      value:"#e4e4e7", fg:"#09090b" },
];

const DEFAULT = THEME_COLORS[0];

export function applyAndSaveAccent(value: string) {
  const theme = THEME_COLORS.find(c => c.value === value) ?? DEFAULT;
  document.documentElement.style.setProperty("--accent",    theme.value);
  document.documentElement.style.setProperty("--accent-fg", theme.fg);
  localStorage.setItem("wrench_accent", value);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  useEffect(() => {
    const saved = localStorage.getItem("wrench_accent");
    applyAndSaveAccent(saved ?? DEFAULT.value);
  }, []);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase.from("profiles").select("avatar_color").eq("id", user.id).single()
      .then(({ data }: { data: { avatar_color: string } | null }) => {
        if (data?.avatar_color) applyAndSaveAccent(data.avatar_color);
      });
  }, [user]);

  return <>{children}</>;
}