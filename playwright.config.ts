import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: "http://localhost:4321",
    trace: "on-first-retry",
  },
  webServer: {
    // Lokal: skip fetch-data GitHub (pakai .cache) — build data fresh hanya di CI.
    command: process.env.CI
      ? "bun run build && bunx astro preview --port 4321"
      : "bun run build:fast && bunx astro preview --port 4321",
    port: 4321,
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
  },
});
