/**
 * M0.4.5 — regression guard for the synthetic ML metrics (PRD §3.1 C2).
 *
 * `/projects/[slug]` used to render an "ML Metrics" section whose loss curves
 * came from `Math.random()` and whose confusion matrices were typed by hand,
 * all presented as real training runs (PRD line 19). The section and
 * `src/lib/ml-metrics.ts` are gone.
 *
 * Why this test reads the page source instead of rendering it: the file is an
 * Astro component that cannot be imported into jsdom, and the failure this
 * guards against is *the section being added back*. A render-based assertion
 * could only prove the string is absent today; a source assertion also fails if
 * someone re-adds the import and leaves the section unrendered — which is
 * precisely how the original defect survived a build that "looked healthy".
 *
 * The assertions are property-based (no ML-metrics import, no `Math.random` in
 * the render path) rather than string-equality on the whole file, so ordinary
 * copy edits to the page do not break them.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const projectPage = readFileSync(resolve(root, "src/pages/projects/[slug].astro"), "utf-8");

describe("synthetic ML metrics stay removed", () => {
  it("the project detail page imports no metrics generator", () => {
    expect(projectPage).not.toMatch(/getMLMetrics|ml-metrics/);
  });

  it("the project detail page renders no ML metrics section", () => {
    expect(projectPage).not.toMatch(/id="ml-metrics"|>ML Metrics</);
  });

  it("the project detail page pulls in no chart atoms that only served it", () => {
    // `NetworkGraph` is deliberately not listed: it is still used by
    // `RepositoryGalaxy`. `LossCurve` and `ConfusionMatrix` had no other consumer.
    expect(projectPage).not.toMatch(/atoms\/(LossCurve|ConfusionMatrix)/);
  });

  it("no source file generates page numbers with Math.random", () => {
    // `ml-metrics.ts` was the one place where randomness fed human-read
    // numbers. `/gallery` experiments may randomise freely (that is the point
    // of a simulation), so the gate is scoped to what a page renders.
    expect(existsSync(resolve(root, "src/lib/ml-metrics.ts"))).toBe(false);
    expect(projectPage).not.toMatch(/Math\.random/);
  });
});
