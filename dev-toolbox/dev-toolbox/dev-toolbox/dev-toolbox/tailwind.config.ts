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
        // Base
        canvas:       "#09090b",
        surface:      "#111113",
        "surface-hover": "#18181b",
        border:       "#27272a",
        "border-focus": "#52525b",

        // Text hierarchy
        "text-primary": "#fafafa",
        "text-secondary": "#a1a1aa",
        "text-muted":   "#71717a",
        "text-disabled": "#3f3f46",

        // Accent — amber/yellow professional tone
        accent:    "#f59e0b",
        "accent-fg": "#09090b",
        "accent-muted": "#78350f",

        // Semantic
        success:   "#22c55e",
        warning:   "#f59e0b",
        error:     "#ef4444",
        info:      "#3b82f6",
        link:      "#60a5fa",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
        lg: "10px",
        xl: "12px",
        "2xl": "16px",
      },
      boxShadow: {
        sm:  "0 1px 2px rgba(0,0,0,0.4)",
        DEFAULT: "0 2px 4px rgba(0,0,0,0.5)",
        md:  "0 4px 8px rgba(0,0,0,0.5)",
        lg:  "0 8px 24px rgba(0,0,0,0.6)",
        "focus-accent": "0 0 0 2px #09090b, 0 0 0 4px #f59e0b",
      },
      animation: {
        "fade-in":   "fade-in 0.15s ease both",
        "slide-up":  "slide-up 0.2s ease both",
        "scale-in":  "scale-in 0.15s ease both",
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
