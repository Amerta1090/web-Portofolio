import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://abdulmajidr708.dev",
  output: "static",
  integrations: [tailwind(), react()],
  build: {
    inlineStylesheets: "auto",
  },
});
