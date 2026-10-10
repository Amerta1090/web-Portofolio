import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const SECTION = "#certifications";
const SPINE = "#career";

/**
 * Certifications bento (Task 2.6) — the homepage splits the 62-certification
 * wall (PRD I5) into one tile per provider, sized by its own count, with a
 * native `<details>` per group. The unit tests pin `facts.certifications` and
 * `selectSpineCertifications` in isolation (`facts.test.ts`, `career-spine
 * .test.ts`); this spec covers what jsdom structurally cannot:
 *
 * 1. **The built page agrees with the dataset.** Expected counts are derived
 *    from `data/certifications.json` itself (read directly: `src/lib/data.ts`
 *    static-imports JSON without import attributes, which Bun's ESM loader
 *    rejects — so the page is built from the real module while this spec reads
 *    the same file). The two group derivations below are deliberate mirrors of
 *    `facts.ts:buildIssuerGroups` (count desc, then `localeCompare`).
 * 2. **No duplication with the Career Spine (M2.6.3).** The spine prints the
 *    newest `TIMELINE_CERTIFICATION_LIMIT` dated certifications; the bento must
 *    list the *rest* and reference `#career`. Disjoint sets + union covering
 *    every record is the exact contract — reprinting one spine entry, or
 *    silently dropping any other, breaks it.
 * 3. **Zero JavaScript.** "0 JS" must be counted (M1.2 mutation M5): Astro does
 *    not escape inline `on*` handlers, so an island count alone can lie.
 * 4. **Visual weight follows the count (M2.6.4).** A tile is dominant when it
 *    holds ≥ half of the largest provider's share — a class pinned to the
 *    number, not a label chosen by hand.
 * 5. **Native disclosure works** (a closed `<details>` is the only point where
 *    the compact entries are invisible) **and nothing overflows** the smallest
 *    viewports.
 */

interface CertificationRecord {
  title: string;
  issuer: string | null;
  date: string | null;
}

const certifications = JSON.parse(
  readFileSync("data/certifications.json", "utf8"),
) as CertificationRecord[];

/** Mirror of `facts.ts:buildIssuerGroups` — count desc, then `localeCompare`. */
function issuerGroups(certs: CertificationRecord[]) {
  const counts = new Map<string, number>();
  for (const cert of certs) {
    const issuer = cert.issuer?.trim() ?? "";
    if (!issuer) continue;
    counts.set(issuer, (counts.get(issuer) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([issuer, count]) => ({ issuer, count }))
    .sort((a, b) => b.count - a.count || a.issuer.localeCompare(b.issuer));
}

const issuers = issuerGroups(certifications);
const largest = issuers[0]?.count ?? 0;

test.describe("certifications bento", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders one tile per provider and the counts account for every certification", async ({
    page,
  }) => {
    const tiles = page.locator(`${SECTION} [data-cert-issuer]`);
    await expect(tiles.first()).toBeAttached();
    expect(await tiles.count()).toBe(issuers.length);

    const counts = await tiles.evaluateAll((nodes) =>
      nodes.map((n) => Number(n.getAttribute("data-cert-count"))),
    );
    // Tile order is data-ordered (biggest first), not hand-picked.
    expect(counts).toEqual(issuers.map((g) => g.count));
    expect(counts.reduce((a, b) => a + b, 0)).toBe(certifications.length);

    // The header prints the same figure the dataset holds.
    await expect(page.locator(`${SECTION} [data-cert-total]`)).toHaveText(
      String(certifications.length),
    );
  });

  test("spine and bento partition the certifications: no duplication, nothing lost", async ({
    page,
  }) => {
    const spineTitles = await page
      .locator(`${SPINE} li[data-career-kind="certification"] h4`)
      .evaluateAll((nodes) => nodes.map((n) => (n.textContent ?? "").trim()));

    const bentoTitles = await page
      .locator(`${SECTION} [data-cert-title]`)
      .evaluateAll((nodes) => nodes.map((n) => (n.textContent ?? "").trim()));

    // The spine is not empty (this would make the partition check vacuous)…
    expect(spineTitles.length).toBeGreaterThan(0);
    expect(new Set(spineTitles).size).toBe(spineTitles.length);

    // …the bento lists the rest, so the two sets are disjoint…
    expect(spineTitles.filter((t) => bentoTitles.includes(t))).toEqual([]);

    // …and together they cover every record in the dataset.
    const union = new Set([...spineTitles, ...bentoTitles]);
    expect(union.size).toBe(certifications.length);

    // The per-tile references must account for exactly the spine entries the
    // page prints — the contract behind "ink the spine instead of duplicating
    // it". (The 15 itself is pinned in `career-spine.test.ts`.)
    const refs = page.locator(`${SECTION} [data-cert-spine-ref]`);
    const claimed = await refs.evaluateAll((nodes) =>
      nodes.map((n) => Number((n.textContent ?? "").match(/(\d+) in/)?.[1] ?? 0)),
    );
    expect(claimed.reduce((a, b) => a + b, 0)).toBe(spineTitles.length);
  });

  test("references the Career Spine from every tile that has an entry there", async ({ page }) => {
    const refs = page.locator(`${SECTION} [data-cert-spine-ref]`);
    const n = await refs.count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i += 1) {
      await expect(refs.nth(i)).toHaveAttribute("href", "#career");
    }
  });

  test("ships zero JavaScript in the section", async ({ page }) => {
    const counts = await page.locator(SECTION).evaluate((section) => {
      const inlineHandlers = [...section.querySelectorAll("*")].filter((node) =>
        [...node.attributes].some((a) => a.name.toLowerCase().startsWith("on")),
      ).length;
      return {
        islands: section.querySelectorAll("astro-island").length,
        scripts: section.querySelectorAll("script").length,
        inlineHandlers,
      };
    });
    expect(counts).toEqual({ islands: 0, scripts: 0, inlineHandlers: 0 });
  });

  test("a closed group still opens natively, no JavaScript required", async ({ page }) => {
    const tile = page.locator(`${SECTION} [data-cert-issuer]`).first();
    const summary = tile.locator("summary");
    expect(await tile.evaluate((el) => el instanceof HTMLDetailsElement && el.open)).toBe(false);

    await summary.click();
    expect(await tile.evaluate((el) => el instanceof HTMLDetailsElement && el.open)).toBe(true);
    await expect(tile.locator("[data-cert-entry]").first()).toBeVisible();
  });

  test("dominant providers lead visually because of the count, not a hardcoded class", async ({
    page,
  }) => {
    const weights = await page.locator(`${SECTION} [data-cert-issuer]`).evaluateAll((nodes) =>
      nodes.map((n) => ({
        count: Number(n.getAttribute("data-cert-count")),
        dominant: (n.className ?? "").includes("sm:col-span-2"),
      })),
    );
    for (const w of weights) {
      expect(w.dominant).toBe(w.count >= largest / 2);
    }
    // The measure actually bites: with today's data exactly the top two lead.
    const expectedDominant = issuers.filter((g) => g.count >= largest / 2).length;
    expect(expectedDominant).toBeGreaterThan(0);
    expect(weights.filter((w) => w.dominant).length).toBe(expectedDominant);
  });

  for (const width of [320, 375, 768]) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const overflow = await page.evaluate(() => {
        const doc = document.scrollingElement ?? document.documentElement;
        return doc.scrollWidth - doc.clientWidth;
      });
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
