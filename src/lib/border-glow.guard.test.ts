import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * H-1 guard (2026-10-28) — the BorderGlow ring must fail closed.
 *
 * `.border-glow::before` paints a mesh and then cuts it down to a 1 px ring with
 * `mask-composite: intersect, subtract`. A browser that ignores `mask-composite`
 * (or honours only the legacy `-webkit-` keywords) composites with `add`
 * instead: the masks union into a full rectangle and the gradient floods the
 * whole card at `opacity: 1`, hiding text and image. That is the reported
 * defect, reproduced by forcing `mask-composite: add`.
 *
 * The fix is structural, so the guard is structural too: the painting rule may
 * only exist inside a `@supports` query for the features that make a ring
 * possible. If someone moves it back out (or loosens the condition), the ring
 * becomes a flood on engines without mask compositing and this test fails.
 *
 * It reads the source file rather than the built CSS because the defect is a
 * property of the authored rule nesting, and because the built sheet is
 * minified into one line where a nesting mistake is invisible to review.
 */
const sourcePath = resolve(dirname(fileURLToPath(import.meta.url)), "layout-queries.css");
const source = readFileSync(sourcePath, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

interface SupportsBlock {
  prelude: string;
  start: number;
  end: number;
}

/** Every `@supports (...) { ... }` block, with the brace range it owns. */
function supportsBlocks(css: string): SupportsBlock[] {
  const blocks: SupportsBlock[] = [];
  const opener = /@supports\s*\(/g;
  let match: RegExpExecArray | null = opener.exec(css);
  while (match) {
    const open = css.indexOf("{", match.index);
    if (open !== -1) {
      let depth = 0;
      let index = open;
      for (; index < css.length; index += 1) {
        if (css[index] === "{") depth += 1;
        if (css[index] === "}") {
          depth -= 1;
          if (depth === 0) break;
        }
      }
      blocks.push({ prelude: css.slice(match.index, open), start: open, end: index });
    }
    match = opener.exec(css);
  }
  return blocks;
}

interface StyleRule {
  selector: string;
  body: string;
  index: number;
}

/** Innermost rules only: a declaration block never contains another `{`. */
function styleRules(css: string): StyleRule[] {
  const rules: StyleRule[] = [];
  const rule = /([^{}]+)\{([^{}]*)\}/g;
  let match: RegExpExecArray | null = rule.exec(css);
  while (match) {
    rules.push({ selector: match[1].trim(), body: match[2], index: match.index });
    match = rule.exec(css);
  }
  return rules;
}

const blocks = supportsBlocks(source);
const rules = styleRules(source);
const glowRules = rules.filter((rule) => rule.selector.includes(".border-glow::before"));

function insideBlock(rule: StyleRule, block: SupportsBlock): boolean {
  return rule.index > block.start && rule.index < block.end;
}

/** A rule paints when it declares any of the properties that produce the mesh. */
function paints(rule: StyleRule): boolean {
  return /(^|;)\s*(content|background|mask|-webkit-mask)\s*:/.test(rule.body);
}

describe("BorderGlow fail-closed guard (H-1)", () => {
  it("finds the rule it is guarding — the scan is not vacuous", () => {
    // Positive control: if a refactor moves the glow to another file, this test
    // must fail loudly instead of passing on an empty list.
    expect(glowRules.length).toBeGreaterThanOrEqual(3);
    expect(glowRules.some((rule) => paints(rule))).toBe(true);
  });

  it("defines every painting rule inside a mask-composite support query", () => {
    const painting = glowRules.filter((rule) => paints(rule));
    expect(painting.length).toBeGreaterThan(0);

    for (const rule of painting) {
      const gate = blocks.find((block) => insideBlock(rule, block));
      expect(
        gate,
        `rule outside any @supports: ${rule.selector} { ${rule.body.trim()} }`,
      ).toBeDefined();
      // Both halves matter: `mask-composite: intersect` is what cuts the ring,
      // and `mask-image` is what proves the engine parses multi-layer masks at all.
      // (The test uses `mask-image:` to match the @supports query, avoiding
      // biome's noShorthandPropertyOverrides on the shorthand `mask:`.)
      expect(gate?.prelude).toContain("mask-composite: intersect");
      expect(gate?.prelude).toContain("mask-image:");
    }
  });

  it("keeps the reveal rule inside the same gate", () => {
    const revealing = glowRules.filter((rule) => /(^|;)\s*opacity\s*:\s*1/.test(rule.body));
    expect(revealing.length).toBeGreaterThan(0);

    for (const rule of revealing) {
      const gate = blocks.find((block) => insideBlock(rule, block));
      expect(gate, `reveal outsde the gate: ${rule.selector}`).toBeDefined();
      expect(gate?.prelude).toContain("mask-composite: intersect");
    }
  });

  it("still switches the layer off for reduced motion and reduced data", () => {
    // The off switches are the second half of "fail closed": they must exist for
    // every engine, so they are deliberately outside the support query.
    const hidden = glowRules.filter((rule) => /display\s*:\s*none/.test(rule.body));
    expect(hidden.length).toBeGreaterThanOrEqual(2);
    const mediaPreludes = source.match(/@media\s*\([^{]*prefers-reduced[^{]*\{/g) ?? [];
    expect(mediaPreludes.join(" ")).toContain("prefers-reduced-motion");
    expect(mediaPreludes.join(" ")).toContain("prefers-reduced-data");
  });
});
