import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // NagarSetu brand palette — AGENTS.md §10.3
        primary: {
          DEFAULT: "#1E40AF", // deep blue
        },
        accent: {
          DEFAULT: "#F59E0B", // amber
        },
        success: {
          DEFAULT: "#10B981",
        },
        warning: {
          DEFAULT: "#F59E0B",
        },
        background: "#F8FAFC",
        foreground: "#0F172A",
        // shadcn/ui standard tokens (mapped to §10.3 palette)
        border: "hsl(214.3 31.8% 91.4%)",
        input: "hsl(214.3 31.8% 91.4%)",
        ring: "#1E40AF",
        muted: {
          DEFAULT: "#F1F5F9",
          foreground: "#475569",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#0F172A",
        },
        "popover": {
          DEFAULT: "#FFFFFF",
          foreground: "#0F172A",
        },
        "primary-foreground": "#FFFFFF",
        "secondary": {
          DEFAULT: "#F1F5F9",
          foreground: "#0F172A",
        },
        "destructive": {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
      },
      borderRadius: {
        xl: "0.75rem",   // rounded-xl for cards per §10.3
        "2xl": "1rem",
        full: "9999px",  // rounded-full for chips per §10.3
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;