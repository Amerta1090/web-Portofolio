/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0f0f11",
          secondary: "#18181b",
          tertiary: "#27272a",
        },
        text: {
          primary: "#fafafa",
          secondary: "#a1a1aa",
        },
        accent: {
          DEFAULT: "#f59e0b",
          muted: "#92400e",
        },
        border: "#27272a",
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
    },
  },
  plugins: [],
};
