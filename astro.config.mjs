import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";
import projectsData from "./data/projects.json" with { type: "json" };
import { retiredRoutes } from "./src/lib/routes.ts";

const RETIRED = new Set(retiredRoutes(projectsData.projects).map((route) => route.from));
const isRetired = (page) => {
  const path = new URL(page).pathname.replace(/\/$/, "") || "/";
  return RETIRED.has(path) || path === "/404";
};

export default defineConfig({
  site: "https://portfolio.abdulmajidr708.workers.dev",
  output: "static",
  integrations: [
    tailwind(),
    react(),
    // Retired routes (MOTION-18) still emit static fallback pages so old links
    // land correctly, but they are not pages of their own: keep them, and the
    // 404, out of the sitemap. Every one carries `data-retired-route`.
    sitemap({ filter: (page) => !isRetired(page) }),
    mdx(),
  ],
  build: {
    inlineStylesheets: "auto",
  },
  markdown: {
    syntaxHighlight: "shiki",
    shikiConfig: {
      theme: "one-dark-pro",
    },
  },
});
