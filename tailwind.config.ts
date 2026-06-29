import type { Config } from "tailwindcss";

const ink = (v: number) => `rgb(var(--ink-${v}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefdf6",
          100: "#d6faea",
          200: "#aff3d6",
          300: "#79e7bd",
          400: "#3fd29e",
          500: "#16b783",
          600: "#0a936b",
          700: "#0a7558",
          800: "#0c5d48",
          900: "#0c4c3c",
          950: "#022b23",
        },
        // Neutral scale backed by CSS variables so it inverts in dark mode.
        ink: {
          50: ink(50),
          100: ink(100),
          200: ink(200),
          300: ink(300),
          400: ink(400),
          500: ink(500),
          600: ink(600),
          700: ink(700),
          800: ink(800),
          900: ink(900),
          950: ink(950),
        },
        // Elevated surface (cards, inputs, popovers): white in light, slate in dark.
        surface: "rgb(var(--surface) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 40px -12px rgba(8, 13, 24, 0.18)",
        glow: "0 0 0 1px rgba(22,183,131,0.25), 0 18px 50px -12px rgba(22,183,131,0.35)",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(0.8)", opacity: "0.7" },
          "80%, 100%": { transform: "scale(2.2)", opacity: "0" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.215,0.61,0.355,1) infinite",
        shimmer: "shimmer 1.6s infinite",
        "fade-up": "fade-up 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
