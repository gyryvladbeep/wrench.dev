import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base — тёмная холодная слейт-палитра с едва заметным
        // фиолетовым подтоном (вместо нейтрального zinc), чтобы
        // сайт не выглядел как типовой "нейро-дизайн" тёмный шаблон,
        // и чтобы оттенок перекликался с космической темой фона.
        // Разница почти незаметна по отдельности, но задаёт узнаваемый
        // характер палитры — контраст к тексту не меняется.
        canvas:          "#0a0a10",
        surface:         "#131319",
        "surface-hover": "#1b1b23",
        border:          "#26262f",
        "border-focus":  "#52525f",

        // Text hierarchy
        "text-primary":   "#f8f8fb",
        "text-secondary": "#a4a4b1",
        "text-muted":     "#76767f",
        "text-disabled":  "#44444e",

        // Dynamic accent — reads from CSS variable set by ThemeProvider.
        // Фича выбора акцентного цвета (10 пресетов) не трогаем —
        // редизайн только вокруг неё.
        accent:         "rgb(var(--accent-rgb) / <alpha-value>)",
        "accent-fg":    "rgb(var(--accent-fg-rgb) / <alpha-value>)",
        "accent-muted": "rgb(var(--accent-rgb) / 0.15)",

        // Semantic
        success: "#22c55e",
        warning: "#f59e0b",
        error:   "#ef4444",
        info:    "#3b82f6",
        link:    "#60a5fa",
      },
      fontFamily: {
        // Body — Manrope (бесплатная замена Euclid Circular B по духу
        // референсов, полная поддержка кириллицы).
        sans: ["var(--font-sans)", "Manrope", "system-ui", "sans-serif"],
        // Заголовки — Unbounded: геометричный, слегка футуристичный
        // дисплейный шрифт с полной кириллицей — держит "космическую"
        // тему в самой типографике, не только в фоне.
        heading: ["var(--font-heading)", "Unbounded", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],
      },
      borderRadius: {
        sm:      "4px",
        DEFAULT: "6px",
        md:      "8px",
        lg:      "10px",
        xl:      "12px",
        "2xl":   "16px",
      },
      boxShadow: {
        sm:      "0 1px 2px rgba(0,0,0,0.4)",
        DEFAULT: "0 2px 4px rgba(0,0,0,0.5)",
        md:      "0 4px 8px rgba(0,0,0,0.5)",
        lg:      "0 8px 24px rgba(0,0,0,0.6)",
        "focus-accent": "0 0 0 2px #0a0a10, 0 0 0 4px rgb(var(--accent-rgb))",
      },
      animation: {
        "fade-in":  "fade-in 0.15s ease both",
        "slide-up": "slide-up 0.2s ease both",
        "scale-in": "scale-in 0.15s ease both",
      },
      keyframes: {
        "fade-in":  { from: { opacity:"0", transform:"translateY(4px)" }, to: { opacity:"1", transform:"none" } },
        "slide-up": { from: { opacity:"0", transform:"translateY(8px)" }, to: { opacity:"1", transform:"none" } },
        "scale-in": { from: { opacity:"0", transform:"scale(0.96)" },    to: { opacity:"1", transform:"scale(1)" } },
      },
    },
  },
  plugins: [],
};

export default config;
