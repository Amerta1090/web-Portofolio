/**
 * M1.3.9 — the island's import list is load-bearing, so it is pinned here.
 *
 * Two separate rules, both of which a rendered-DOM test cannot see:
 *
 * 1. **No data layer in a client island.** Q4.1 BUG FIX 1: `case-study-reactor.ts`
 *    imported the *value* `PROCESS_STAGE_IDS` from a zod schema module, which
 *    dragged the whole validator chain into an island's chunk — 18.5 KB gzip for
 *    one five-item string array. `career-spine.ts` imports the entire data layer,
 *    so the island must not import it, `data.ts`, or even the ids module. It
 *    reads the rendered page instead, which is why it takes no props.
 *
 * 2. **No global ScrollTrigger kill.** Task 0.7: `useGSAP`'s cleanup ran
 *    `ScrollTrigger.getAll().forEach(kill)` after `ctx.revert()`, killing every
 *    trigger on the page — including the neighbouring Journey Timeline's, whose
 *    owner never rebuilt it because its own dependencies had not changed. That is
 *    permanent damage, and this island creates its own trigger, so the pattern
 *    must not come back.
 *
 * Why read the source instead of the DOM: a behavioural test proves what the
 * island does *today*; these guards fail the moment the import is added, even if
 * the added import is currently unreachable at runtime. Precedent:
 * `src/lib/ml-metrics.removed.test.ts`.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const island = readFileSync(resolve(root, "src/islands/CareerSpine.tsx"), "utf-8");

/**
 * Strip comments before scanning.
 *
 * Both rules are about *code*, and both files explain the rules in prose — a
 * naive substring match reads its own documentation as a violation. This is the
 * third time in this sprint a scan-based guard has caught its own comment (M0.5's
 * `hasTarget`, M0.6's `projects_shipped`).
 */
const code = island
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "")
  .trim();

describe("CareerSpine island stays off the data layer", () => {
  it("imports neither the career spine contract nor its id vocabulary", () => {
    // `career-spine.ts` pulls in the whole data layer; `career-spine-ids.ts` is
    // value-only, so importing it would still ship strings into the chunk. Only
    // the zero-import helper and the shared roving helpers are allowed.
    expect(code).not.toMatch(/from\s+"\.\.\/lib\/(data|creative\/career-spine)"/);
    expect(code).not.toMatch(/career-spine-ids/);
  });

  it("imports only the island-safe modules", () => {
    // Spelled out rather than negated, so adding a new dependency is a
    // deliberate edit to this list rather than a silent bundle change.
    // Deduplicated: the island imports a type and its values in separate statements,
    // and the list is about *which modules* reach the chunk, not how many statements.
    const imports = [...new Set([...code.matchAll(/from\s+"([^"]+)"/g)].map((m) => m[1]))].sort();
    expect(imports).toEqual([
      "../lib/creative/career-spine-select",
      "../lib/creative/roving",
      "../lib/gsap",
      "motion/react",
      "react",
    ]);
  });

  it("takes no props, so no data can reach it through the island boundary", () => {
    expect(code).toMatch(/export default function CareerSpine\(\)/);
  });
});

describe("CareerSpine island never kills triggers it does not own", () => {
  it("does not call ScrollTrigger.getAll()", () => {
    // The local cleanup keeps the trigger it created and kills that by
    // reference; `useGSAP.test.tsx` asserts the same rule behaviourally.
    expect(code).not.toMatch(/ScrollTrigger\.getAll/);
  });

  it("kills the trigger it created, by reference", () => {
    expect(code).toMatch(/const trigger = ScrollTrigger\.create\(/);
    expect(code).toMatch(/return \(\) => trigger\.kill\(\)/);
  });
});
