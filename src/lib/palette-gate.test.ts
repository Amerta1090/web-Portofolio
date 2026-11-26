/**
 * M4.6.4 — palette gate (Task 4.6 "Prove It" Sprint 4).
 *
 * Rule 3 / Rule 11: DOM paths read colour only through token CSS vars
 * (`--color-brand`, `--color-danger`, …), never hardcoded Tailwind palette
 * utilities. Sprint 4 M4.6 converted every documented UI file (RepoGlowCard,
 * EasterEgg, GalleryGrid, CommandPalette, resume/gallery/
 * observatory pages, timeline) — this gate keeps it at zero.
 *
 * DOCUMENTED EXCEPTIONS (keputusan user 2026-10-17):
 * - `src/islands/experiments/**` — the /gallery playground: canvas/SVG palette
 *   constants and the experiment chrome (slider `accent-amber-500` etc.) keep
 *   their per-experiment colour identity by design (Rule 3's documented-canvas
 *   exception, extended to the lab chrome).
 * - `src/lib/lab-gallery.ts` — the 27 gradient literals: 13 hue families used
 *   purely as per-experiment contact-sheet identity; tokenising them would add
 *   ~13 semantic tokens × light/dark for one decorative surface (see the
 *   interface comment there).
 *
 * MOTION-14 adds a second scan: the retired sage/clay palette (and the old
 * near-black surfaces) must not come back. The sprint replaced them with
 * tokens, and a literal `#7a8c6f` in a component is invisible to the utility
 * pattern above while being just as wrong — it would not follow the theme.
 *
 * The gate scans the SOURCE tree (not dist) so ordinary edits elsewhere are
 * caught before build; exclusions are explicit paths, not submodule regexes,
 * so a new UI file is covered by default.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const srcDir = join(root, "src");

/**
 * Files whitelisted by the two documented exceptions above. Paths are written
 * against the repo root and compared via `relative` so this also runs from any
 * working directory.
 */
const WHITELIST = [
  join("src", "islands", "experiments"),
  join("src", "islands", "experiments", "__tests__"),
  join("src", "lib", "lab-gallery.ts"),
];

const PALETTE =
  /red-500|amber-500|emerald-|bg-amber|amber-[3467-9]00\b|text-amber|border-amber|from-amber|to-amber|via-amber/;

/**
 * MOTION-14 — palette literals that no longer exist in the design system.
 * Each entry is a hex or an RGB triplet, not a regex: the point is that these
 * exact values must not reappear. Tests are excluded from the scan because
 * they quote these values on purpose (theme-tokens.test.ts does).
 */
const RETIRED = [
  { label: "sage brand (was --color-brand)", pattern: /#7a8c6f/i },
  { label: "clay warm (was --color-brand-warm)", pattern: /#c17f59/i },
  { label: "sage light accent", pattern: /#5d6b54/i },
  { label: "sage muted", pattern: /#8fa284/i },
  { label: "sage brand rgb triplet", pattern: /\b122 140 111\b/ },
  { label: "sage light-accent rgb triplet", pattern: /\b93 107 84\b/ },
  { label: "clay warm rgb triplet", pattern: /\b193 127 89\b/ },
  { label: "old amber action", pattern: /#f59e0b/i },
  { label: "old near-black surface", pattern: /#0f0f11/i },
  { label: "old near-black surface (galaxy)", pattern: /#06070a/i },
  { label: "old raised surface (galaxy)", pattern: /#0e0f11/i },
];

/** Remove comments so a note *describing* a retired value is not an offence. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
}

function collectFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const isFile = statSync(full).isFile();
    if (!isFile) {
      out.push(...collectFiles(full));
      continue;
    }
    if (/\.(ts|tsx|astro)$/.test(name)) out.push(full);
  }
  return out;
}

const whitelistAbs = new Set(WHITELIST.map((w) => resolve(root, w)));

const offenders: string[] = [];
const files = collectFiles(srcDir);
for (const file of files) {
  if (/\.test\.[tj]sx?$/.test(file)) continue; // tests may quote the pattern
  if (file.endsWith(join("palette-gate.test.ts"))) continue;
  const rel = relative(root, file);
  if (whitelistAbs.has(resolve(file)) || [...whitelistAbs].some((w) => file.startsWith(w + sep))) {
    continue;
  }
  const source = readFileSync(file, "utf-8");
  if (PALETTE.test(source)) offenders.push(rel);
}

const retiredOffenders: string[] = [];
for (const file of files) {
  if (/\.test\.[tj]sx?$/.test(file)) continue;
  if (file.endsWith(join("palette-gate.test.ts"))) continue;
  const rel = relative(root, file);
  if (whitelistAbs.has(resolve(file)) || [...whitelistAbs].some((w) => file.startsWith(w + sep))) {
    continue;
  }
  const source = stripComments(readFileSync(file, "utf-8"));
  const hits = RETIRED.filter((entry) => entry.pattern.test(source)).map((entry) => entry.label);
  if (hits.length > 0) retiredOffenders.push(`${rel}: ${hits.join(", ")}`);
}

describe("palette gate — DOM color via tokens only (Task 4.6)", () => {
  it("matches every source file the exclusions are meant to protect", () => {
    // Positive control that the scan walks the tree: the two exception roots
    // and the converted UI files must all be inside the scanned set.
    expect(files.length).toBeGreaterThan(200);
    for (const member of [
      join("src", "lib", "lab-gallery.ts"),
      join("src", "islands", "experiments", "UlamSpiral.tsx"),
      join("src", "components", "atoms", "RepoGlowCard.tsx"),
    ]) {
      expect(files).toContainEqual(resolve(root, member));
    }
  });

  it("no Tailwind palette utilities outside the documented exceptions", () => {
    expect(offenders).toEqual([]);
  });

  it("no retired palette literals outside the documented exceptions", () => {
    // MOTION-14 replaced the sage/clay palette with theme tokens. A literal
    // hex here would survive the utility scan above and ignore the theme.
    expect(retiredOffenders).toEqual([]);
  });

  it("the retired-value scan keeps its teeth", () => {
    const matches = (value: string) => RETIRED.some((entry) => entry.pattern.test(value));
    expect(matches("#7a8c6f")).toBe(true);
    expect(matches("#C17F59")).toBe(true);
    expect(matches("rgb(122 140 111 / 0.6)")).toBe(true);
    expect(matches("#0f0f11")).toBe(true);
    // Live tokens and the approved palette must not match.
    expect(matches("var(--color-brand)")).toBe(false);
    expect(matches("#dafa9c")).toBe(false);
    expect(matches("#3f5410")).toBe(false);
    expect(matches("#56cebf")).toBe(false);
    // A comment naming a retired value is documentation, not a colour.
    expect(stripComments("/* was #7a8c6f */ color: var(--color-brand);")).not.toMatch(/#7a8c6f/i);
  });

  it("the pattern itself keeps its teeth — matches and misses as intended", () => {
    // Belt-and-braces: a corrupted PALETTE regex (always-false) would make the
    // previous assertion pass vacuously. This file quoting the pattern is the
    // reason test files are excluded from the scan.
    expect("text-amber-400").toMatch(PALETTE);
    expect("bg-amber-500/20").toMatch(PALETTE);
    expect("border-amber-300").toMatch(PALETTE);
    expect("accent-amber-500").toMatch(PALETTE);
    expect("text-brand").not.toMatch(PALETTE);
    expect("bg-brand-warm/20").not.toMatch(PALETTE);
    expect("border-danger").not.toMatch(PALETTE);
  });
});
