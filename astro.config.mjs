import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://abdulmajidr708.dev",
  output: "static",
  integrations: [tailwind(), react(), sitemap()],
  build: {
    inlineStylesheets: "auto",
  },
});
