import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://abdulmajidr708.dev",
  output: "static",
  integrations: [tailwind(), react(), sitemap(), mdx()],
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
