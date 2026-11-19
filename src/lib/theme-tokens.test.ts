/**
 * MOTION-14 — token integrity for the dark-room palette (D-13).
 *
 * `theme.css` writes each colour twice: a hex for humans and an `-rgb`
 * triplet for Tailwind's `rgb(var(--x-rgb) / <alpha>)`. The light block
 * shipped `--color-brand-rgb: 93 107 84` against `#7a8c6f` for months, so a
 * colour could look correct in one path (`text-brand`) and wrong in another
 * (`bg-brand/20`) with no gate to notice. This test is that gate.
 *
 * It also pins the approved palette itself (soot/ink/lime dark, paper/soot/
 * olive light) and the presence of the tokens the sprint introduced. Token
 * *values* belong here because `theme.css` is the source of truth; consumers
 * must never pin them (contrast gates read computed styles instead).
 */

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const css = readFileSync(join(root, "src", "styles", "theme.css"), "utf-8");
const tailwindConfig = readFileSync(join(root, "tailwind.config.mjs"), "utf-8");

/** Strip CSS comments: the file documents the old sage values on purpose. */
const cssNoComments = css.replace(/\/\*[\s\S]*?\*\//g, "");

/**
 * Collect the flat top-level blocks (`selector { … }`) of a CSS file. The
 * theme file has no nested at-rules, so a non-greedy scan is exact; if that
 * ever changes the block lookup below fails loudly rather than silently.
 */
function parseBlocks(source: string): Map<string, string> {
  const blocks = new Map<string, string>();
  const re = /(^|\n)([^\n{}]+)\{([\s\S]*?)\n\}/g;
  let match = re.exec(source);
  while (match) {
    blocks.set(match[2].trim(), match[3]);
    match = re.exec(source);
  }
  return blocks;
}

function declarations(block: string): Map<string, string> {
  const out = new Map<string, string>();
  const re = /--([a-z0-9-]+):\s*([^;]+);/g;
  let match = re.exec(block);
  while (match) {
    out.set(match[1], match[2].trim());
    match = re.exec(block);
  }
  return out;
}

function rgbTriplet(hex: string): string | null {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return null;
  return [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16)).join(" ");
}

const blocks = parseBlocks(cssNoComments);
// The light selector is written as two lines (`:root,` then `.light {`), so
// the flat-block scan keys it by its final selector.
const light = declarations(blocks.get(".light") ?? "");
const dark = declarations(blocks.get(".dark") ?? "");

/** Key tokens the sprint introduced; both themes must carry every one. */
const REQUIRED = [
  "color-surface-primary",
  "color-surface-secondary",
  "color-surface-tertiary",
  "color-text-primary",
  "color-text-secondary",
  "color-brand",
  "color-brand-text",
  "color-brand-muted",
  "color-brand-warm",
  "color-border",
  "color-border-strong",
  "color-danger",
  "color-on-accent",
  "color-on-brand",
  "color-data-ml",
  "color-data-web",
  "color-data-iot",
  "color-data-cli",
  "color-data-devops",
  "color-data-other",
];

/** The owner-approved palette (D-13). Changing it is a decision, not a tweak. */
const APPROVED: Record<"light" | "dark", Record<string, string>> = {
  light: {
    "color-surface-primary": "#f2f2ee",
    "color-text-primary": "#111110",
    "color-brand": "#3f5410",
    "color-on-brand": "#f2f2ee",
  },
  dark: {
    "color-surface-primary": "#0f0f0f",
    "color-text-primary": "#f2f2ee",
    "color-brand": "#dafa9c",
    "color-on-brand": "#0f0f0f",
  },
};

describe("theme tokens — hex and -rgb cannot disagree", () => {
  it("parses both theme blocks", () => {
    expect(light.size).toBeGreaterThan(30);
    expect(dark.size).toBeGreaterThan(30);
    // Positive control that the block lookup is not returning an empty map
    // and still resolving the selectors that carry the palette.
    expect(light.get("color-brand")).toMatch(/^#[0-9a-f]{6}$/i);
    expect(dark.get("color-brand")).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it.each(["light", "dark"] as const)("every %s colour token has a matching triplet", (theme) => {
    const decls = theme === "light" ? light : dark;
    const mismatches: string[] = [];

    for (const [name, value] of decls) {
      if (!name.startsWith("color-")) continue;
      if (name.endsWith("-rgb")) continue;
      const triplet = decls.get(`${name}-rgb`);
      if (!triplet) {
        mismatches.push(`${name}: missing ${name}-rgb`);
        continue;
      }
      const expected = rgbTriplet(value);
      if (expected === null) {
        mismatches.push(`${name}: ${value} is not a 6-digit hex`);
        continue;
      }
      if (triplet !== expected) mismatches.push(`${name}: ${value} ≠ ${triplet}`);
    }

    expect(mismatches).toEqual([]);
  });

  it.each(["light", "dark"] as const)("every %s triplet has its hex sibling", (theme) => {
    const decls = theme === "light" ? light : dark;
    const orphans = [...decls.keys()]
      .filter((name) => name.startsWith("color-") && name.endsWith("-rgb"))
      .filter((name) => !decls.has(name.slice(0, -"-rgb".length)));
    expect(orphans).toEqual([]);
  });

  it("declares the same colour token names in both themes", () => {
    // `--radius` lives once on `:root` and is shared; only the palette has to
    // be complete in both blocks.
    const colourNames = (decls: Map<string, string>) =>
      [...decls.keys()].filter((name) => name.startsWith("color-")).sort();
    expect(colourNames(light)).toEqual(colourNames(dark));
  });

  it("carries every token the sprint introduced", () => {
    for (const token of REQUIRED) {
      expect(light.has(token), `light missing --${token}`).toBe(true);
      expect(dark.has(token), `dark missing --${token}`).toBe(true);
      expect(light.has(`${token}-rgb`), `light missing --${token}-rgb`).toBe(true);
      expect(dark.has(`${token}-rgb`), `dark missing --${token}-rgb`).toBe(true);
    }
  });

  it("ships the approved palette in each theme", () => {
    for (const [theme, expected] of Object.entries(APPROVED)) {
      const decls = theme === "light" ? light : dark;
      for (const [name, value] of Object.entries(expected)) {
        expect(decls.get(name), `${theme} ${name}`).toBe(value);
      }
    }
    // The themes are not tints of each other.
    expect(light.get("color-surface-primary")).not.toBe(dark.get("color-surface-primary"));
    expect(light.get("color-brand")).not.toBe(dark.get("color-brand"));
  });

  it("keeps data colours away from the action colour", () => {
    for (const [theme, decls] of [
      ["light", light],
      ["dark", dark],
    ] as const) {
      const brand = decls.get("color-brand");
      for (const series of ["ml", "web", "iot", "cli", "devops", "other"]) {
        expect(
          decls.get(`color-data-${series}`),
          `${theme} data-${series} reuses the brand`,
        ).not.toBe(brand);
      }
    }
  });

  it("has no retired sage/clay palette values", () => {
    const retired = [
      /7a8c6f/i,
      /c17f59/i,
      /5d6b54/i,
      /8fa284/i,
      /122 140 111/,
      /93 107 84/,
      /193 127 89/,
    ];
    for (const pattern of retired) {
      expect(cssNoComments).not.toMatch(pattern);
    }
    // The historical note is allowed to name them, which is why comments are
    // stripped above — a positive control that stripping is doing the work.
    expect(css).toMatch(/7a8c6f/);
  });

  it("has one dark block, not a duplicated alias", () => {
    // `.light.dark-mode` was an unreachable second definition of the dark
    // palette (only occurrence in the repo); two sources of one truth is how
    // the hex/triplet drift above happened in the first place.
    expect(cssNoComments).not.toMatch(/\.light\.dark-mode/);
    expect(cssNoComments.match(/^\.dark\s*\{$/m) ?? []).toHaveLength(1);
  });

  it("maps the new border token into Tailwind", () => {
    expect(tailwindConfig).toContain(
      '"border-strong": "rgb(var(--color-border-strong-rgb) / <alpha-value>)"',
    );
  });

  it("the triplet comparison has teeth", () => {
    expect(rgbTriplet("#dafa9c")).toBe("218 250 156");
    expect(rgbTriplet("#0f0f0f")).toBe("15 15 15");
    expect(rgbTriplet("#f2f2ee")).toBe("242 242 238");
    // A stale triplet must be detectable: this is the exact class of bug the
    // file guarded against (brand-rgb 93 107 84 vs #7a8c6f).
    expect(rgbTriplet("#7a8c6f")).not.toBe("93 107 84");
    expect(rgbTriplet("rgb(1 2 3)")).toBeNull();
  });
});
