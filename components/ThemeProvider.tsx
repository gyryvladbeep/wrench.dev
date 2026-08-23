"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";

const DEFAULT_ACCENT = "#f59e0b";

export const THEME_COLORS = [
  { label:"Amber",   labelRu:"Янтарный",  value:"#f59e0b", fg:"#09090b" },
  { label:"Blue",    labelRu:"Синий",     value:"#3b82f6", fg:"#ffffff" },
  { label:"Violet",  labelRu:"Фиолетовый",value:"#8b5cf6", fg:"#ffffff" },
  { label:"Green",   labelRu:"Зелёный",   value:"#22c55e", fg:"#09090b" },
  { label:"Red",     labelRu:"Красный",   value:"#ef4444", fg:"#ffffff" },
  { label:"Cyan",    labelRu:"Циановый",  value:"#06b6d4", fg:"#09090b" },
  { label:"Pink",    labelRu:"Розовый",   value:"#ec4899", fg:"#ffffff" },
  { label:"Orange",  labelRu:"Оранжевый", value:"#f97316", fg:"#09090b" },
  { label:"Lime",    labelRu:"Лаймовый",  value:"#84cc16", fg:"#09090b" },
  { label:"White",   labelRu:"Белый",     value:"#e4e4e7", fg:"#09090b" },
];

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `${r} ${g} ${b}`;
}

function applyAccent(color: string) {
  const theme = THEME_COLORS.find(c => c.value === color) ?? THEME_COLORS[0];
  document.documentElement.style.setProperty("--accent-hex", theme.value);
  document.documentElement.style.setProperty("--accent-fg-hex", theme.fg);
  document.documentElement.style.setProperty("--color-accent", hexToRgb(theme.value));
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  useEffect(() => {
    // Apply saved color or default
    const saved = localStorage.getItem("wrench_accent");
    applyAccent(saved ?? DEFAULT_ACCENT);
  }, []);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase.from("profiles").select("avatar_color").eq("id", user.id).single()
      .then(({ data }: { data: { avatar_color: string } | null }) => {
        if (data?.avatar_color) {
          applyAccent(data.avatar_color);
          localStorage.setItem("wrench_accent", data.avatar_color);
        }
      });
  }, [user]);

  return <>{children}</>;
}

export function applyAndSaveAccent(color: string) {
  applyAccent(color);
  localStorage.setItem("wrench_accent", color);
}