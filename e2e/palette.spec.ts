/**
 * MOTION-14 (M14.4) — palette contrast, measured from live computed values.
 *
 * Rule: contrast and colour gates read what the browser resolved, never a
 * constant typed into the test. The only values this file pins come from
 * `src/styles/theme.css` through `theme-tokens.ts`, and those are used to
 * *identify* the palette (which block a theme must resolve), not to predict
 * its contrast.
 *
 * What is gated in both themes:
 *  - every text token is AA (≥ 4.5:1) on all three surfaces;
 *  - `--color-brand` is AA as text (it is used as `text-brand` in ~96 places);
 *  - `--color-on-brand` is AA on the brand fill;
 *  - `--color-border-strong` is ≥ 3:1 on every surface (meaningful boundaries);
 *  - the six data series are ≥ 3:1 on the primary surface and never reuse the
 *    action colour (lime means action, keyed data must not compete);
 *  - the browser's hex and `-rgb` forms agree for every colour token;
 *  - no inline palette override is written to `<html>` (the D-14 hazard: an
 *    inline custom property outranks `:root` and `.dark`).
 *
 * A positive control asserts the decorative hairline *fails* 3:1, so a broken
 * contrast helper cannot make the suite green.
 */

import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { contrast, hexToTriplet, themeTokens } from "./theme-tokens";

type Theme = "light" | "dark";

const SURFACES = [
  "color-surface-primary",
  "color-surface-secondary",
  "color-surface-tertiary",
] as const;
const TEXT = [
  "color-text-primary",
  "color-text-secondary",
  "color-brand",
  "color-brand-warm",
  "color-danger",
] as const;
const DATA = [
  "color-data-ml",
  "color-data-web",
  "color-data-iot",
  "color-data-cli",
  "color-data-devops",
  "color-data-other",
] as const;

interface LiveTheme {
  isDark: boolean;
  tokens: Record<string, string>;
  inlineStyle: string;
}

async function readLiveTheme(page: Page): Promise<LiveTheme> {
  return page.evaluate(() => {
    const computed = getComputedStyle(document.documentElement);
    const tokens: Record<string, string> = {};
    for (const name of Array.from(computed)) {
      if (name.startsWith("--color-")) tokens[name] = computed.getPropertyValue(name).trim();
    }
    return {
      isDark: document.documentElement.classList.contains("dark"),
      tokens,
      inlineStyle: document.documentElement.getAttribute("style") ?? "",
    };
  });
}

async function openIn(page: Page, theme: Theme): Promise<LiveTheme> {
  await page.addInitScript((value) => {
    localStorage.setItem("theme", JSON.stringify({ state: { theme: value }, version: 1 }));
  }, theme);
  await page.goto("/");
  // Wait for the store writer, not just SSR markup (SSR always paints `dark`).
  if (theme === "dark") {
    await expect(page.locator("html")).toHaveClass(/dark/, { timeout: 15_000 });
  } else {
    await expect(page.locator("html")).not.toHaveClass(/dark/, { timeout: 15_000 });
  }
  const live = await readLiveTheme(page);
  expect(live.isDark).toBe(theme === "dark");
  return live;
}

const rgb = (token: string) => `rgb(${token.split(" ").join(", ")})`;

for (const theme of ["light", "dark"] as const) {
  test.describe(`palette — ${theme} theme`, () => {
    test("every text token clears AA on every surface", async ({ page }) => {
      const live = await openIn(page, theme);
      const failures: string[] = [];

      for (const surface of SURFACES) {
        const background = live.tokens[`--${surface}-rgb`];
        expect(background, `${surface} token missing`).toBeTruthy();
        for (const text of TEXT) {
          const foreground = live.tokens[`--${text}-rgb`];
          expect(foreground, `${text} token missing`).toBeTruthy();
          const ratio = contrast(rgb(foreground), rgb(background));
          if (ratio < 4.5) failures.push(`${text} on ${surface}: ${ratio.toFixed(2)}`);
        }
      }

      expect(failures).toEqual([]);
    });

    test("text on the brand fill clears AA", async ({ page }) => {
      const live = await openIn(page, theme);
      const ratio = contrast(
        rgb(live.tokens["--color-on-brand-rgb"]),
        rgb(live.tokens["--color-brand-rgb"]),
      );
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    test("meaningful boundaries clear 3:1 on every surface", async ({ page }) => {
      const live = await openIn(page, theme);
      const failures: string[] = [];

      for (const surface of SURFACES) {
        const ratio = contrast(
          rgb(live.tokens["--color-border-strong-rgb"]),
          rgb(live.tokens[`--${surface}-rgb`]),
        );
        if (ratio < 3) failures.push(`${surface}: ${ratio.toFixed(2)}`);
      }

      expect(failures).toEqual([]);
    });

    test("data series clear 3:1 and never reuse the action colour", async ({ page }) => {
      const live = await openIn(page, theme);
      const primary = rgb(live.tokens["--color-surface-primary-rgb"]);
      const brand = live.tokens["--color-brand"];
      const failures: string[] = [];

      for (const series of DATA) {
        expect(live.tokens[`--${series}`], `${series} not the action colour`).not.toBe(brand);
        const ratio = contrast(rgb(live.tokens[`--${series}-rgb`]), primary);
        if (ratio < 3) failures.push(`${series}: ${ratio.toFixed(2)}`);
      }

      expect(failures).toEqual([]);
    });

    test("browser hex and -rgb forms agree for every colour token", async ({ page }) => {
      const live = await openIn(page, theme);
      const mismatches: string[] = [];

      for (const [name, value] of Object.entries(live.tokens)) {
        if (!name.endsWith("-rgb")) continue;
        const hexName = name.slice(0, -"-rgb".length);
        const hex = live.tokens[hexName];
        if (!hex) {
          mismatches.push(`${name}: no hex sibling`);
          continue;
        }
        if (/^#[0-9a-f]{6}$/i.test(hex)) {
          const expected = hexToTriplet(hex);
          if (value !== expected) mismatches.push(`${hexName}: ${hex} ≠ ${value}`);
        } else if (value !== "") {
          mismatches.push(`${hexName}: ${hex} is not a hex`);
        }
      }

      expect(mismatches).toEqual([]);
    });

    test("the theme resolves its own palette block, not the other one", async ({ page }) => {
      const live = await openIn(page, theme);
      const expected = themeTokens[theme];
      for (const token of ["color-brand", "color-surface-primary", "color-text-secondary"]) {
        expect(live.tokens[`--${token}`], token).toBe(expected[token]);
      }
      // And the two blocks are not the same palette, or the assertion above
      // would pass for either theme.
      expect(themeTokens.light["color-brand"]).not.toBe(themeTokens.dark["color-brand"]);
    });

    test("writes no inline palette override on <html>", async ({ page }) => {
      const live = await openIn(page, theme);
      const paletteWrites = live.inlineStyle
        .split(";")
        .map((entry) => entry.trim())
        .filter((entry) => entry.startsWith("--color-") || entry.startsWith("--accent"));

      // D-14: the customiser no longer sets colours at all. Density variables
      // are the only legitimate inline writes.
      expect(paletteWrites).toEqual([]);
    });

    test("positive control — the decorative hairline does fail 3:1", async ({ page }) => {
      const live = await openIn(page, theme);
      const ratio = contrast(
        rgb(live.tokens["--color-border-rgb"]),
        rgb(live.tokens["--color-surface-primary-rgb"]),
      );
      // If this ever passes 3:1 the helper or the boundary token is wrong —
      // the hairline is decorative by design and must not be used for a
      // meaningful boundary.
      expect(ratio).toBeLessThan(3);
      expect(ratio).toBeGreaterThan(1);
    });
  });
}
