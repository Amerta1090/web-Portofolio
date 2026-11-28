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
    // Both tiers use `build:fast` (validate-data + astro build): CI has no
    // `.cache/github`, so the workflow copies `e2e/fixtures/github-cache/` in
    // first and the build must not run `fetch-data` (network + a token, and a
    // dataset that changes daily — a gate whose inputs move cannot report a
    // regression). Production deploys still use `bun run build`.
    command: "bun run build:fast && bunx astro preview --port 4321",
    port: 4321,
    reuseExistingServer: !process.env.CI,
    // `build:fast` measured 32–37 s on this 4-core/3 GB box (72 pages,
    // 2026-11-28; the 3m16s recorded in 2026-10 was the 49-page era under a
    // GitHub rate limit). 180 s covers both; `bun run serve &` still saves the
    // ~35 s rebuild on every local run.
    timeout: 180000,
  },
});
