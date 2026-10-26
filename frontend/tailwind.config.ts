// import type { Config } from "tailwindcss";

// const config: Config = {
//   darkMode: ["class"],
//   content: [
//     "./app/**/*.{ts,tsx}",
//     "./components/**/*.{ts,tsx}",
//     "./lib/**/*.{ts,tsx}",
//   ],
//   theme: {
//     extend: {
//       colors: {
//         brand: {
//           900: "#1E3A8A",
//           700: "#1E40AF",
//           500: "#3B82F6",
//           100: "#DBEAFE",
//           50: "#EFF6FF",
//         },
//         accent: {
//           500: "#F59E0B",
//           100: "#FEF3C7",
//           50: "#FFFBEB",
//         },
//         success: {
//           600: "#059669",
//           100: "#D1FAE5",
//         },
//         // NagarSetu brand palette — AGENTS.md §10.3
//         primary: {
//           DEFAULT: "#1E40AF",
//         },
//         warning: {
//           DEFAULT: "#F59E0B",
//         },
//         background: "#F8FAFC",
//         foreground: "#0F172A",
//         border: "hsl(214.3 31.8% 91.4%)",
//         input: "hsl(214.3 31.8% 91.4%)",
//         ring: "#1E40AF",
//         muted: {
//           DEFAULT: "#F1F5F9",
//           foreground: "#475569",
//         },
//         card: {
//           DEFAULT: "#FFFFFF",
//           foreground: "#0F172A",
//         },
//         popover: {
//           DEFAULT: "#FFFFFF",
//           foreground: "#0F172A",
//         },
//         "primary-foreground": "#FFFFFF",
//         secondary: {
//           DEFAULT: "#F1F5F9",
//           foreground: "#0F172A",
//         },
//         destructive: {
//           DEFAULT: "#EF4444",
//           foreground: "#FFFFFF",
//         },
//       },
//       borderRadius: {
//         xl: "0.75rem",
//         "2xl": "1rem",
//         card: "12px",
//         chip: "9999px",
//         full: "9999px",
//       },
//       fontFamily: {
//         sans: ["var(--font-inter)", "system-ui", "sans-serif"],
//       },
//       boxShadow: {
//         card: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
//         cardHover: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
//       },
//       keyframes: {
//         "pulse-slow": {
//           "0%, 100%": { opacity: "1" },
//           "50%": { opacity: "0.4" },
//         },
//       },
//       animation: {
//         "pulse-slow": "pulse-slow 1.5s ease-in-out infinite",
//       },
//     },
//   },
//   plugins: [require("tailwindcss-animate")],
// };

// export default config;

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
        brand: {
          900: "#1E3A8A",
          700: "#1E40AF",
          500: "#3B82F6",
          100: "#DBEAFE",
          50: "#EFF6FF",
        },
        accent: {
          500: "#F59E0B",
          100: "#FEF3C7",
          50: "#FFFBEB",
        },
        success: {
          600: "#059669",
          100: "#D1FAE5",
        },
        // NagarSetu brand palette — AGENTS.md §10.3
        primary: {
          DEFAULT: "#1E40AF",
        },
        warning: {
          DEFAULT: "#F59E0B",
        },
        background: "#F8FAFC",
        foreground: "#0F172A",
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
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#0F172A",
        },
        "primary-foreground": "#FFFFFF",
        secondary: {
          DEFAULT: "#F1F5F9",
          foreground: "#0F172A",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
        card: "12px",
        chip: "9999px",
        full: "9999px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        cardHover: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
      },
      keyframes: {
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        // NEW: 250ms enter animation (chat bubbles, expanded step details)
        enter: {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        // NEW: typing indicator dots
        dot: {
          "0%, 60%, 100%": { opacity: "0.3" },
          "30%": { opacity: "1" },
        },
      },
      animation: {
        "pulse-slow": "pulse-slow 1.5s ease-in-out infinite",
        // NEW
        enter: "enter 250ms ease-out both",
        dot: "dot 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;