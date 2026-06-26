/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: {
          primary: "rgb(var(--color-surface-primary-rgb) / <alpha-value>)",
          secondary: "rgb(var(--color-surface-secondary-rgb) / <alpha-value>)",
          tertiary: "rgb(var(--color-surface-tertiary-rgb) / <alpha-value>)",
        },
        text: {
          primary: "rgb(var(--color-text-primary-rgb) / <alpha-value>)",
          secondary: "rgb(var(--color-text-secondary-rgb) / <alpha-value>)",
        },
        brand: {
          DEFAULT: "rgb(var(--color-brand-rgb) / <alpha-value>)",
          muted: "rgb(var(--color-brand-muted-rgb) / <alpha-value>)",
        },
        border: "rgb(var(--color-border-rgb) / <alpha-value>)",
        bg: {
          primary: "rgb(var(--color-surface-primary-rgb) / <alpha-value>)",
          secondary: "rgb(var(--color-surface-secondary-rgb) / <alpha-value>)",
          tertiary: "rgb(var(--color-surface-tertiary-rgb) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--color-brand-rgb) / <alpha-value>)",
          muted: "rgb(var(--color-brand-muted-rgb) / <alpha-value>)",
          glow: "rgb(var(--color-brand-rgb) / 0.3)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.75rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "1.375" }],
        "3xl": ["1.875rem", { lineHeight: "1.3" }],
        "4xl": ["2.25rem", { lineHeight: "1.25" }],
        "5xl": ["3rem", { lineHeight: "1.15" }],
        "6xl": ["3.75rem", { lineHeight: "1.1" }],
        "7xl": ["4.5rem", { lineHeight: "1.05" }],
      },
      fontWeight: {
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
      },
      maxWidth: {
        content: "1200px",
        text: "720px",
        narrow: "680px",
        wide: "1280px",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "48px",
        "2xl": "96px",
        0.5: "2px",
        1.5: "6px",
        2.5: "10px",
        3.5: "14px",
        4.5: "18px",
        5.5: "22px",
        6.5: "26px",
        7.5: "30px",
        9: "36px",
        11: "44px",
        13: "52px",
        14: "56px",
        15: "60px",
        17: "68px",
        18: "72px",
        19: "76px",
        22: "88px",
        30: "120px",
        32: "128px",
        40: "160px",
      },
      animation: {
        glitch: "glitch-anim 0.4s infinite linear alternate-reverse",
        halftone: "halftone-move 10s linear infinite",
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "border-rotate": "border-rotate 4s linear infinite",
        "reveal-up": "reveal-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        fadeIn: "fadeIn 0.4s ease-out forwards",
      },
      keyframes: {
        "glitch-anim": {
          "0%": { clipPath: "inset(10% 0 80% 0)", transform: "translate(-2px, 2px) skewX(-15deg)" },
          "20%": {
            clipPath: "inset(80% 0 10% 0)",
            transform: "translate(2px, -2px) skewX(-15deg)",
          },
          "40%": {
            clipPath: "inset(40% 0 50% 0)",
            transform: "translate(-2px, 2px) skewX(-15deg)",
          },
          "60%": { clipPath: "inset(90% 0 5% 0)", transform: "translate(2px, -2px) skewX(-15deg)" },
          "80%": {
            clipPath: "inset(20% 0 60% 0)",
            transform: "translate(-2px, 2px) skewX(-15deg)",
          },
          "100%": {
            clipPath: "inset(50% 0 30% 0)",
            transform: "translate(2px, -2px) skewX(-15deg)",
          },
        },
        "halftone-move": {
          "0%": { backgroundPosition: "0 0, 10px 10px" },
          "100%": { backgroundPosition: "-40px -40px, -30px -30px" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 var(--color-brand-glow)" },
          "70%": { boxShadow: "0 0 0 15px transparent" },
          "100%": { boxShadow: "0 0 0 0 transparent" },
        },
        "border-rotate": {
          to: { transform: "rotate(360deg)" },
        },
        "reveal-up": {
          from: { opacity: "0", transform: "translateY(40px) skewX(-5deg)" },
          to: { opacity: "1", transform: "translateY(0) skewX(0deg)" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
