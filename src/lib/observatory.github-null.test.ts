/**
 * M0.8.3 — guard the half of the fix that jsdom cannot import.
 *
 * `ObservatoryOverview.test.tsx` proves the island omits its GitHub cards when
 * handed `null`. It cannot prove the page ever *hands* it `null`: that coercion
 * was `ds.github?.total_stars ?? 0` inside `src/pages/observatory.astro`, an
 * Astro component that cannot be rendered in jsdom. Passing `null` in a test
 * would only prove the island tolerates a value the page never produced — the
 * island half green while the page still published zeros.
 *
 * So this reads the source. That is the same trade `projects-detail.dead-control.test.ts`
 * makes for `/projects/[slug]`, and for the same reason: the file under guard is
 * not importable, and the failure is in a value computed at build time.
 *
 * Scope: it bans the `?? 0` fallback on a GitHub field specifically. A blanket
 * ban on `?? 0` would be wrong — the same page legitimately floors division
 * results to zero (`barPct`, `edgeOpacity`).
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pagePath = resolve(__dirname, "../pages/observatory.astro");
const page = readFileSync(pagePath, "utf-8");

describe("observatory.astro GitHub metrics", () => {
  it("passes null rather than 0 when there is no GitHub cache", () => {
    // The exact defect: `?? 0` made an absent cache render as "0 GitHub stars".
    expect(page).not.toMatch(/github\?\.total_\w+\s*\?\?\s*0/);
  });

  it("still coerces the two GitHub metrics it renders", () => {
    // Guards the other direction: deleting the metrics entirely would satisfy the
    // test above while silently dropping real numbers from the page.
    expect(page).toMatch(/totalStars:\s*ds\.github\?\.total_stars\s*\?\?\s*null/);
    expect(page).toMatch(/totalForks:\s*ds\.github\?\.total_forks\s*\?\?\s*null/);
  });

  it("does not pass a metric the island never renders", () => {
    // `totalRepos` was passed into the island and never displayed there — dead
    // weight in the props contract, and the Observatory plan lists six cards that
    // do not include it (Rule 6).
    expect(page).not.toMatch(/totalRepos:/);
  });
});
