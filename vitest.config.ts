import path from "path";
import { defineConfig } from "vitest/config";

/**
 * Two projects: pure logic runs under `node` (no jsdom to boot per file),
 * everything that touches the DOM runs under `jsdom`. A new `src/lib` test that
 * needs the DOM fails loudly ("document is not defined") — add it to
 * `NEEDS_DOM`, don't move the whole folder back.
 */
const NODE_TESTS = ["src/lib/**/*.test.ts", "scripts/**/*.test.mjs", "src/content/**/*.test.ts"];
const NEEDS_DOM = [
  "src/lib/assistant/useAssistantSession.test.ts",
  "src/lib/page-continuity.test.ts",
  "src/lib/recommend/session.test.ts",
  "src/lib/recommend/useRecommendation.test.ts",
  "src/lib/scroll-lock.test.ts",
  "src/lib/useThemeStore.test.ts",
];
const EXCLUDE = ["e2e/**", "node_modules/**", "dist/**", ".opencode/**", ".motion-mock/**"];

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@components": path.resolve(__dirname, "src/components"),
      "@lib": path.resolve(__dirname, "src/lib"),
      "@types": path.resolve(__dirname, "src/types"),
      "@data": path.resolve(__dirname, "data"),
    },
  },
  test: {
    globals: true,
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          include: NODE_TESTS,
          exclude: [...EXCLUDE, ...NEEDS_DOM],
        },
      },
      {
        extends: true,
        test: {
          name: "dom",
          environment: "jsdom",
          setupFiles: ["./src/test/setup.ts"],
          css: true,
          include: ["src/**/*.test.tsx", "src/islands/**/*.test.ts", ...NEEDS_DOM],
          exclude: EXCLUDE,
        },
      },
    ],
  },
});
