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
        admin: {
          bg: "#0f1117",
          surface: "#161b27",
          elevated: "#1c2333",
          border: "#2a3347",
          "border-subtle": "#1e2a3d",
        },
        primary: {
          DEFAULT: "#6366f1",
          hover: "#4f46e5",
          muted: "#312e81",
          light: "#818cf8",
        },
        text: {
          primary: "#f1f5f9",
          secondary: "#94a3b8",
          muted: "#475569",
          inverse: "#0f172a",
        },
        status: {
          success: "#22c55e",
          "success-muted": "#14532d",
          danger: "#ef4444",
          "danger-muted": "#7f1d1d",
          warning: "#f59e0b",
          "warning-muted": "#78350f",
          info: "#3b82f6",
          "info-muted": "#1e3a5f",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-in": "slideIn 0.2s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "spin-slow": "spin 3s linear infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.4), 0 1px 2px -1px rgba(0,0,0,0.4)",
        "card-hover":
          "0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -2px rgba(0,0,0,0.4)",
        glow: "0 0 20px rgba(99, 102, 241, 0.15)",
        "glow-sm": "0 0 10px rgba(99, 102, 241, 0.1)",
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      },
    },
  },
  plugins: [],
};

export default config;
