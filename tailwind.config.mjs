/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0a0a0a",
          secondary: "#111111",
          tertiary: "#1a1a1a",
        },
        text: {
          primary: "#ffffff",
          secondary: "#a1a1aa",
        },
        accent: {
          DEFAULT: "#e60012",
          muted: "#ff00c1",
          glow: "rgba(230, 0, 18, 0.3)",
        },
        border: "#e60012",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      maxWidth: {
        content: "1200px",
        text: "720px",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "48px",
        "2xl": "96px",
      },
      animation: {
        "glitch": "glitch-anim 0.4s infinite linear alternate-reverse",
        "halftone": "halftone-move 10s linear infinite",
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "border-rotate": "border-rotate 4s linear infinite",
        "reveal-up": "reveal-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fadeIn": "fadeIn 0.4s ease-out forwards",
      },
      keyframes: {
        "glitch-anim": {
          "0%": { clipPath: "inset(10% 0 80% 0)", transform: "translate(-2px, 2px) skewX(-15deg)" },
          "20%": { clipPath: "inset(80% 0 10% 0)", transform: "translate(2px, -2px) skewX(-15deg)" },
          "40%": { clipPath: "inset(40% 0 50% 0)", transform: "translate(-2px, 2px) skewX(-15deg)" },
          "60%": { clipPath: "inset(90% 0 5% 0)", transform: "translate(2px, -2px) skewX(-15deg)" },
          "80%": { clipPath: "inset(20% 0 60% 0)", transform: "translate(-2px, 2px) skewX(-15deg)" },
          "100%": { clipPath: "inset(50% 0 30% 0)", transform: "translate(2px, -2px) skewX(-15deg)" },
        },
        "halftone-move": {
          "0%": { backgroundPosition: "0 0, 10px 10px" },
          "100%": { backgroundPosition: "-40px -40px, -30px -30px" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 var(--accent-glow)" },
          "70%": { boxShadow: "0 0 0 15px transparent" },
          "100%": { boxShadow: "0 0 0 0 transparent" },
        },
        "border-rotate": {
          "to": { transform: "rotate(360deg)" },
        },
        "reveal-up": {
          "from": { opacity: "0", transform: "translateY(40px) skewX(-5deg)" },
          "to": { opacity: "1", transform: "translateY(0) skewX(0deg)" },
        },
        "fadeIn": {
          "from": { opacity: "0", transform: "translateY(12px)" },
          "to": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
