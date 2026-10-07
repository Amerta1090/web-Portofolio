import { expect, test } from "@playwright/test";
import { waitForIslandHydration } from "./hydration";

/**
 * The hero evidence row (M2.1) — the claim, and where it can be checked.
 *
 * The numbers, and more importantly the *omission* rules, are pinned by
 * `src/lib/hero-metrics.test.ts`; this spec covers the three things a unit test
 * structurally cannot:
 *
 * 1. **The target exists.** `#github-metrics` is a fact about the built page. A
 *    link to an anchor nobody renders is the same defect as a button with no
 *    handler, and asserting the `href` string would pass either way (Task 0.5).
 * 2. **Two render sites agree.** The row and the GitHub section read the same
 *    dataset through two different components, so comparing what each prints is
 *    the only way to prove the hero row is evidence rather than decoration. This
 *    is the actual product contract of M2.1.2, and it cannot be checked in jsdom.
 * 3. **It survives without JavaScript.** The island hydrates on idle, and every
 *    figure is in the server HTML; a row that only appears after hydration would
 *    make the hero's first claim depend on a bundle arriving.
 *
 * Nothing here pins a cached figure. `bun run build` refreshes the GitHub cache,
 * so `571` and `27` are outputs, not contracts — the contracts are the shape of
 * the name, the target of the link, and the agreement between the two sites.
 */

const ROW = "[data-hero-metric-row]";
const METRIC = "[data-hero-metric]";

/** The section the row points at; its presence is part of what is being tested. */
const EVIDENCE_SECTION = "#github-metrics";

/**
 * `Longest streak: 27 days` → `["Longest streak", "27 days"]`.
 *
 * Split on the first `": "` because a suffix legitimately contains a space and a
 * label could contain a colon in future data. Returns `null` when the name is not
 * in the expected shape, which is itself a failure worth reporting by name.
 */
function splitName(name: string): { label: string; value: string } | null {
  const at = name.indexOf(": ");
  if (at < 1) return null;
  return { label: name.slice(0, at), value: name.slice(at + 2) };
}

test.describe("hero evidence row", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("every figure is a link, and the section it names is on the page", async ({ page }) => {
    const row = page.locator(ROW);
    await expect(row).toHaveCount(1);

    const links = row.locator(METRIC);
    await expect(links.first()).toBeAttached();

    const hrefs = await links.evaluateAll((nodes) =>
      nodes.map((n) => (n as HTMLAnchorElement).getAttribute("href")),
    );
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) expect(href).toBe(EVIDENCE_SECTION);

    // The href is only worth anything if something answers to it.
    await expect(page.locator(EVIDENCE_SECTION)).toHaveCount(1);
  });

  test("the accessible name is `Kind: value` and carries the visible text", async ({ page }) => {
    const links = page.locator(METRIC);
    await expect(links.first()).toBeAttached();

    const pairs = await links.evaluateAll((nodes) =>
      nodes.map((node) => {
        const el = node as HTMLAnchorElement;
        const label = el.querySelector(".section-label")?.textContent?.trim() ?? "";
        // The value spans nest, so the text has to be read with whitespace
        // collapsed rather than compared raw: the accessible name is built from
        // the builder's fields, and this is what proves it matches the screen.
        const value = (el.firstElementChild?.textContent ?? "").replace(/\s+/g, " ").trim();
        return { name: el.getAttribute("aria-label"), label, value };
      }),
    );

    for (const { name, label, value } of pairs) {
      expect(label.length).toBeGreaterThan(0);
      expect(value.length).toBeGreaterThan(0);
      // Exact shape, not a word budget (Q4.2 #8): the bug being prevented is a
      // name that grows into a paragraph, and a threshold breaks on a long month.
      expect(name).toBe(`${label}: ${value}`);
      // WCAG 2.5.3: the visible label has to survive inside the name.
      expect(name).toContain(label);
    }
  });

  test("is readable with JavaScript disabled", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/");

    const links = page.locator(METRIC);
    await expect(links.first()).toBeAttached();
    expect(await links.count()).toBeGreaterThan(0);

    // Every figure keeps its name and its value with nothing to run.
    const names = await links.evaluateAll((nodes) =>
      nodes.map((n) => ({
        name: n.getAttribute("aria-label"),
        text: (n.textContent ?? "").replace(/\s+/g, " ").trim(),
      })),
    );
    for (const { name, text } of names) {
      const parsed = splitName(name ?? "");
      expect(parsed, `name "${name}" is not \`Kind: value\``).not.toBeNull();
      expect(text).toContain(parsed?.value);
    }

    await context.close();
  });

  test("is static under reduced motion, with no animation wrapper", async ({ page }) => {
    // `test.use({ reducedMotion })` is silently ignored in this Playwright
    // version (Q4.2 #1), so the preference is set on the page and verified
    // through the row's own state hook rather than assumed.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await waitForIslandHydration(page, METRIC);

    expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(
      true,
    );

    const row = page.locator(ROW);
    await expect(row).toHaveAttribute("data-hero-metric-row", "ready");
    // The static branch is a plain `<ul>`: nothing to animate means no inline
    // style from motion at all.
    expect(await row.getAttribute("style")).toBeNull();
    await expect(page.locator(METRIC).first()).toBeVisible();
  });

  test("the section it links to prints the same figures", async ({ page }) => {
    const links = page.locator(METRIC);
    await expect(links.first()).toBeAttached();

    const names = await links.evaluateAll((nodes) =>
      nodes.map((n) => n.getAttribute("aria-label") ?? ""),
    );

    // Arriving the way a reader does: by following the link. `scrollIntoViewIfNeeded`
    // on a section taller than the viewport aligns its *bottom*, which scrolls the
    // counter row past the top of the screen — `useInView` then never fires and every
    // `MetricCounter` sits at its initial `0`. Measured both ways: following the link
    // puts the section top at 122px with the counters at 505px, and they read 47/9/0/571;
    // `scrollIntoViewIfNeeded` put the counters at −152px, i.e. never in view at all.
    await links.first().click();
    await expect(page).toHaveURL(new RegExp(`${EVIDENCE_SECTION}$`));
    // The Command Center island specifically, not `.text-center` (which only exists
    // once it has hydrated) and not the first island in the section: `#github-metrics`
    // also holds BootSequence, CodeDNAHelix and GitHubPhase3, and the dormant ones
    // never hydrate because they are `client:visible` inside a hidden phase.
    await waitForIslandHydration(
      page,
      '#github-metrics astro-island[component-url*="GitHubCommandCenter"]',
    );

    const compare = () =>
      page.evaluate((metricNames) => {
        const section = document.querySelector("#github-metrics");
        if (!section) return { missingSection: true, unmatched: metricNames };
        const leaves = Array.from(section.querySelectorAll<HTMLElement>("p, span")).filter(
          (el) => el.children.length === 0,
        );
        /**
         * Compare on lowercased alphanumerics, on *both* sides. The card
         * concatenates the figure with its caption ("27daysLongest streak"), and
         * the section capitalises inconsistently — `most_active_day` is stored
         * lowercased and turned into "TUE" by a CSS `capitalize`, while
         * `busiest_month` is a proper noun with an uppercase "S" in the DOM.
         * Normalising only the metric name (the first version of this test) reads
         * `September` as not containing `september`.
         */
        const norm = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");

        return {
          missingSection: false,
          unmatched: metricNames.filter((name) => {
            const at = name.indexOf(": ");
            if (at < 1) return true;
            const label = norm(name.slice(0, at));
            const value = norm(name.slice(at + 2));
            const labelEl = leaves.find((el) => norm(el.textContent ?? "") === label);
            // The figure and its caption share a container in both card shapes:
            // the Astro cards (`div` wrapping the number and the caption) and
            // `MetricCounter` (`div.text-center`).
            return !norm(labelEl?.parentElement?.textContent ?? "").includes(value);
          }),
        };
      }, names);

    await expect.poll(compare, { timeout: 15_000 }).toEqual({
      missingSection: false,
      unmatched: [],
    });
  });

  test("does not overflow the viewport on small screens", async ({ page }) => {
    for (const width of [320, 375, 768]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.locator(METRIC).first()).toBeAttached();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(0);
    }
  });
});
