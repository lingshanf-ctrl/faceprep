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
        /* Core Colors */
        background: "#FFFFFF",
        foreground: {
          DEFAULT: "#0A0A0A",
          muted: "#6B6B6B",
        },
        /* Klein Blue Accent */
        accent: {
          DEFAULT: "#0025E0",
          light: "#1A3FE8",
          dark: "#001BB0",
        },
        /* Surface Colors */
        surface: {
          DEFAULT: "#F5F5F5",
          elevated: "#FFFFFF",
        },
        /* Border */
        border: {
          DEFAULT: "#E5E5E5",
          hover: "#D4D4D4",
        },
        /* Semantic Colors */
        success: {
          DEFAULT: "#10B981",
          light: "#34D399",
          dark: "#059669",
        },
        warning: {
          DEFAULT: "#F59E0B",
          light: "#FBBF24",
          dark: "#D97706",
        },
        error: {
          DEFAULT: "#EF4444",
          light: "#F87171",
          dark: "#DC2626",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Sora", "Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        /* Premium Type Scale */
        "display-xl": ["5rem", { lineHeight: "1.1", letterSpacing: "-0.03em" }],
        "display-lg": ["4rem", { lineHeight: "1.1", letterSpacing: "-0.03em" }],
        "display": ["3rem", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
        "display-sm": ["2.5rem", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        "heading-xl": ["2rem", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        "heading-lg": ["1.5rem", { lineHeight: "1.3", letterSpacing: "-0.01em" }],
        "heading": ["1.25rem", { lineHeight: "1.4", letterSpacing: "-0.01em" }],
        "body-lg": ["1.125rem", { lineHeight: "1.6" }],
        "body": ["1rem", { lineHeight: "1.6" }],
        "small": ["0.875rem", { lineHeight: "1.5" }],
        "xs": ["0.75rem", { lineHeight: "1.5" }],
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "30": "7.5rem",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        /* Premium Shadow System */
        subtle: "0 1px 2px rgba(0, 0, 0, 0.04)",
        soft: "0 2px 8px rgba(0, 0, 0, 0.06)",
        "soft-md": "0 4px 16px rgba(0, 0, 0, 0.08)",
        "soft-lg": "0 8px 32px rgba(0, 0, 0, 0.1)",
        "soft-xl": "0 16px 48px rgba(0, 0, 0, 0.12)",
        glow: "0 0 40px rgba(0, 37, 224, 0.15)",
        "glow-lg": "0 0 60px rgba(0, 37, 224, 0.2)",
      },
      transitionTimingFunction: {
        "premium": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      transitionDuration: {
        "400": "400ms",
        "600": "600ms",
        "800": "800ms",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(40px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scale-in": "scale-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        float: "float 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
