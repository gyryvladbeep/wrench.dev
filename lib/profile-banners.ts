// ═══════════════════════════════════════════════════════
// Пресеты баннера профиля
// ═══════════════════════════════════════════════════════
// Тот же принцип, что у THEME_COLORS (components/ThemeProvider.tsx) для
// цвета аватарки — готовый выбор из нескольких вариантов, без загрузки
// картинок (стореджа под изображения в проекте нет, и пользователь сам
// об этом просил — самовыражение без загрузки файлов). Баннер —
// двухцветный градиент, а не один цвет, поэтому свой отдельный набор, а
// не переиспользование THEME_COLORS впрямую — но составлен из тех же
// самых оттенков бренда, чтобы баннер и аватарка не спорили друг с
// другом по палитре, даже если пользователь выбрал разные пресеты для
// каждого.

export interface BannerGradient {
  id:      string;
  label:   string;
  labelRu: string;
  // Готовая строка для style={{ background: css }} — не собираем её из
  // кусков на месте использования, чтобы CSS синтаксис градиента жил
  // ровно в одном месте.
  css:     string;
}

export const BANNER_GRADIENTS: BannerGradient[] = [
  { id: "amber-violet", label: "Amber / Violet",  labelRu: "Янтарный / Фиолетовый",  css: "linear-gradient(135deg, #f59e0b, #8b5cf6)" },
  { id: "blue-cyan",    label: "Blue / Cyan",      labelRu: "Синий / Циановый",        css: "linear-gradient(135deg, #3b82f6, #06b6d4)" },
  { id: "green-lime",   label: "Green / Lime",     labelRu: "Зелёный / Лаймовый",      css: "linear-gradient(135deg, #22c55e, #84cc16)" },
  { id: "red-orange",   label: "Red / Orange",     labelRu: "Красный / Оранжевый",     css: "linear-gradient(135deg, #ef4444, #f97316)" },
  { id: "pink-violet",  label: "Pink / Violet",    labelRu: "Розовый / Фиолетовый",    css: "linear-gradient(135deg, #ec4899, #8b5cf6)" },
  { id: "slate-cyan",   label: "Slate / Cyan",     labelRu: "Графитовый / Циановый",   css: "linear-gradient(135deg, #334155, #06b6d4)" },
];

export function getBannerGradient(id: string | null | undefined): BannerGradient | null {
  if (!id) return null;
  return BANNER_GRADIENTS.find((b) => b.id === id) ?? null;
}
