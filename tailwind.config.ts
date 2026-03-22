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
        /* === Stitch Design System === */
        /* Base Surface — warm cream editorial base */
        background: "#fcf9f8",

        /* Text */
        foreground: {
          DEFAULT: "#1c1b1b",   // on-surface (never pure black)
          muted: "#434655",     // on-surface-variant
          subtle: "#737686",    // outline (disabled / placeholder)
        },

        /* Primary — deep professional blue with gradient soul */
        accent: {
          DEFAULT: "#004ac6",   // primary
          light: "#2563eb",     // primary-container
          dark: "#003ea8",      // on-primary-fixed-variant
          fixed: "#dbe1ff",     // primary-fixed (tint backgrounds)
        },

        /* Surface Hierarchy — tonal layering, no hard borders */
        surface: {
          DEFAULT: "#f6f3f2",        // surface-container-low (in-page containers)
          elevated: "#ffffff",       // surface-container-lowest (maximum lift, floating)
          container: "#f0eded",      // surface-container
          high: "#eae7e7",           // surface-container-high (depressed/secondary)
          highest: "#e5e2e1",        // surface-container-highest
          dim: "#dcd9d9",            // surface-dim (disabled states)
          base: "#fcf9f8",           // surface / background base
        },

        /* Border — ghost only, used at low opacity */
        border: {
          DEFAULT: "#c3c6d7",        // outline-variant (use at 15–20% opacity)
          strong: "#737686",         // outline (labels / form borders)
          hover: "#b0b3c5",
        },

        /* Secondary — warm grays */
        secondary: {
          DEFAULT: "#5f5e5e",
          container: "#e2dfde",
          muted: "#c8c6c5",
        },

        /* Semantic */
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
          DEFAULT: "#ba1a1a",        // aligned with Stitch error
          light: "#ffdad6",
          dark: "#93000a",
          container: "#ffdad6",
        },

        /* Inverse (dark overlays) */
        inverse: {
          surface: "#313030",
          primary: "#b4c5ff",
          "on-surface": "#f3f0ef",
        },
      },

      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },

      fontSize: {
        /* Stitch Editorial Scale */
        "display-xl": ["3.5rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-lg": ["2.5rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display":    ["2rem",   { lineHeight: "1.15", letterSpacing: "-0.02em" }],
        "display-sm": ["1.75rem",{ lineHeight: "1.2",  letterSpacing: "-0.02em" }],
        "heading-xl": ["1.5rem", { lineHeight: "1.25", letterSpacing: "-0.01em" }],
        "heading-lg": ["1.25rem",{ lineHeight: "1.3",  letterSpacing: "-0.01em" }],
        "heading":    ["1.125rem",{ lineHeight: "1.4", letterSpacing: "-0.005em" }],
        "body-lg":    ["1rem",   { lineHeight: "1.65" }],
        "body":       ["0.9375rem",{ lineHeight: "1.65" }],
        "small":      ["0.875rem",{ lineHeight: "1.5" }],
        "xs":         ["0.75rem", { lineHeight: "1.5" }],
        "xxs":        ["0.625rem",{ lineHeight: "1.4", letterSpacing: "0.06em" }],
      },

      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "30": "7.5rem",
      },

      borderRadius: {
        "4xl": "2rem",
        // Override defaults for Stitch — professional, not bubbly
        DEFAULT: "0.25rem",    // 4px
        sm: "0.375rem",        // 6px
        md: "0.5rem",          // 8px
        lg: "0.75rem",         // 12px — most components
        xl: "1rem",            // 16px
        "2xl": "1.25rem",      // 20px
        "3xl": "1.5rem",       // 24px
      },

      boxShadow: {
        /* Stitch Ambient Shadow System — diffused, never dark smudges */
        subtle:    "0 20px 40px rgba(28, 27, 27, 0.04)",
        soft:      "0 20px 40px rgba(28, 27, 27, 0.06)",
        "soft-md": "0 20px 40px rgba(28, 27, 27, 0.08)",
        "soft-lg": "0 20px 40px rgba(28, 27, 27, 0.10)",
        "soft-xl": "0 20px 40px rgba(28, 27, 27, 0.15)",
        /* Primary glow — CTA buttons */
        glow:      "0 4px 12px rgba(0, 74, 198, 0.20)",
        "glow-lg": "0 8px 24px rgba(0, 74, 198, 0.25)",
        /* Floating modals */
        float:     "0 20px 40px rgba(28, 27, 27, 0.06), 0 0 0 1px rgba(195, 198, 215, 0.08)",
      },

      backgroundImage: {
        /* Signature primary gradient */
        "primary-gradient":     "linear-gradient(135deg, #004ac6 0%, #2563eb 100%)",
        "primary-gradient-r":   "linear-gradient(225deg, #004ac6 0%, #2563eb 100%)",
        /* Surface gradients */
        "surface-gradient":     "linear-gradient(180deg, #fcf9f8 0%, #f6f3f2 100%)",
        /* Hero sections */
        "hero-gradient":        "linear-gradient(135deg, #004ac6 0%, #2563eb 60%, #3b82f6 100%)",
      },

      transitionTimingFunction: {
        premium: "cubic-bezier(0.16, 1, 0.3, 1)",
      },

      transitionDuration: {
        "400": "400ms",
        "600": "600ms",
        "800": "800ms",
      },

      keyframes: {
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(32px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%":   { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },

      animation: {
        "fade-up":  "fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in":  "fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scale-in": "scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        float:      "float 3s ease-in-out infinite",
        shimmer:    "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
