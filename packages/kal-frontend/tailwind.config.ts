import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme backgrounds
        dark: {
          DEFAULT: "#0a0a0a",
          surface: "#141414",
          elevated: "#1a1a1a",
          border: "#262626",
        },
        // Green accent colors
        accent: {
          DEFAULT: "#10b981",
          hover: "#34d399",
          muted: "#065f46",
        },
        // Text colors
        content: {
          primary: "#ffffff",
          secondary: "#a3a3a3",
          muted: "#525252",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "panel-slide-in": "panelSlideIn 0.25s ease-out",
        "neon-pulse": "neonPulse 2s ease-in-out infinite",
        "tooltip-in": "tooltipIn 0.15s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        panelSlideIn: {
          "0%": { opacity: "0", transform: "translateX(100%)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        neonPulse: {
          "0%, 100%": {
            boxShadow:
              "0 0 4px rgba(16,185,129,0.4), 0 0 8px rgba(16,185,129,0.2)",
          },
          "50%": {
            boxShadow:
              "0 0 8px rgba(16,185,129,0.6), 0 0 16px rgba(16,185,129,0.3)",
          },
        },
        tooltipIn: {
          "0%": { opacity: "0", transform: "translateX(-4px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
