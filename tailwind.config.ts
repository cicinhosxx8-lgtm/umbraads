import type { Config } from "tailwindcss";

/**
 * Design tokens do UmbraAds (fonte da verdade: os HTMLs em
 * "UmbraAds — Espionagem de Anúncios/" e o CLAUDE.md de design).
 *
 * As cores base (zinc / amber / emerald / red / violet) já existem no
 * Tailwind com EXATAMENTE os hex usados no design, então não as
 * redefinimos. Aqui adicionamos apenas: a fonte Inter, aliases
 * semânticos ("brand", "surface", etc.) para dar intenção ao código,
 * e a animação de pulso do Scale Score "ESCALANDO".
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // Aliases semânticos — apontam para os tokens exatos do design.
        brand: {
          DEFAULT: "#f59e0b", // amber-500
          hover: "#fbbf24", // amber-400
          accent: "#fcd34d", // amber-300
        },
        app: "#09090b", // zinc-950 — fundo do app
        surface: "#18181b", // zinc-900 — cards/painéis
        line: "#27272a", // zinc-800 — bordas
        "line-hover": "#3f3f46", // zinc-700 — borda hover
        good: { DEFAULT: "#10b981", soft: "#34d399" }, // emerald 500/400
        bad: { DEFAULT: "#ef4444", soft: "#f87171" }, // red 500/400
        validated: { DEFAULT: "#8b5cf6", soft: "#a78bfa" }, // violet 500/400
      },
      keyframes: {
        umbraPulse: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(245,158,11,0.5)" },
          "50%": { boxShadow: "0 0 0 5px rgba(245,158,11,0)" },
        },
      },
      animation: {
        "umbra-pulse": "umbraPulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
