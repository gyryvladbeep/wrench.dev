import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#0B0B0F",
        surface: "#14141B",
        "surface-hover": "#1C1C26",
        border: "#26262F",
        "text-primary": "#F2F2F5",
        "text-muted": "#9A9AA8",
        accent: {
          DEFAULT: "#F0A23A", // signature amber — "terminal cursor" accent
          dim: "#8A5E22",
          fg: "#0B0B0F",
        },
        link: "#7C8CF8",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        DEFAULT: "10px",
      },
    },
  },
  plugins: [],
};

export default config;
