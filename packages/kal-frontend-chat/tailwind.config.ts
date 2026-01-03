import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

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
        // Chat-specific colors
        chat: {
          user: "#10b981",      // Green for user messages
          assistant: "#262626", // Dark gray for assistant
          input: "#1a1a1a",
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
        "pulse-dot": "pulseDot 1.5s infinite",
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
        pulseDot: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [typography],
};

export default config;
