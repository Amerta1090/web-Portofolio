/**
 * MOTION-14 — read the palette from its single source (`src/styles/theme.css`).
 *
 * The palette gates used to pin hex values inside the spec (`93 107 84`,
 * `122 140 111`). That is the exact drift `src/lib/theme-tokens.test.ts`
 * exists to prevent: a spec that quotes a colour stops testing the product
 * the moment the product changes, and it cannot tell "the theme is wrong"
 * from "the spec is stale". These helpers read the shipped token file, so a
 * palette change moves the expectation with it while the assertions still
 * catch a theme that resolves the *other* block's value.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const themeCss = readFileSync(resolve(process.cwd(), "src/styles/theme.css"), "utf-8").replace(
  /\/\*[\s\S]*?\*\//g,
  "",
);

function block(selector: string): string {
  // Flat top-level blocks only; `theme.css` has no nested rules.
  const re = new RegExp(
    `${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{([\\s\\S]*?)\\n\\}`,
  );
  const match = re.exec(themeCss);
  if (!match) throw new Error(`theme.css: block ${selector} not found`);
  return match[1];
}

function declarations(source: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /--([a-z0-9-]+):\s*([^;]+);/g;
  let match = re.exec(source);
  while (match) {
    out[match[1]] = match[2].trim();
    match = re.exec(source);
  }
  return out;
}

export function hexToTriplet(hex: string): string {
  const value = hex.trim();
  if (!/^#[0-9a-f]{6}$/i.test(value)) throw new Error(`not a 6-digit hex: ${hex}`);
  return [1, 3, 5].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16)).join(" ");
}

/** `#dafa9c` → `218 250 156`, the form the browser reports for `-rgb` tokens. */
export function tripletOf(decls: Record<string, string>, token: string): string {
  const value = decls[token];
  if (!value) throw new Error(`theme.css: --${token} not found`);
  return hexToTriplet(value);
}

/** Every declaration of each theme block, keyed without the leading `--`. */
export const themeTokens = {
  light: declarations(block(".light")),
  dark: declarations(block(".dark")),
};

/** The `-rgb` triplet the browser must resolve for a token in a theme. */
export function themeTriplet(theme: "light" | "dark", token: string): string {
  return tripletOf(themeTokens[theme], token);
}

export function parseChannels(input: string): [number, number, number] {
  const nums = input.match(/[\d.]+/g)?.map(Number) ?? [];
  return [nums[0] ?? 0, nums[1] ?? 0, nums[2] ?? 0];
}

export function luminance(channels: string): number {
  const [r, g, b] = parseChannels(channels);
  const gamma = (value: number) => {
    const s = value / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * gamma(r) + 0.7152 * gamma(g) + 0.0722 * gamma(b);
}

/** WCAG contrast for two `rgb(…)` / `r g b` strings. */
export function contrast(a: string, b: string): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
