import { expect, test } from "@playwright/test";

/**
 * `#career` — the Career Spine, rendered server-side with no JS.
 *
 * Why this spec exists rather than a unit test: the number M1.2.4 asks to be
 * pinned is "how many events reach the page", and only the built page can
 * answer that. The unit suite already pins **26** for the contract
 * (`career-spine.test.ts`), and the unit suite structurally *cannot* import an
 * `.astro` component — that blind spot is exactly what let a dead control live
 * on `/projects/<slug>` until Task 0.5. `astro/container` was tried for this and
 * abandoned: Astro 6.1 exports the runtime but not the Vite plugin it needs
 * (`vite-plugin-container` is only imported by `astro/dist/core/create-vite.js`,
 * not re-exported), so the only way in is a deep `dist/` import.
 *
 * Every count below is pinned on purpose (Rule 7). If `data/*.json` changes,
 * this file and `career-spine.test.ts` must change together — that is the point
 * of pinning instead of deriving.
 */

/** Events the spine must render: 7 experience + 15 certifications + 3 honors + 1 volunteering. */
const EVENT_COUNT = 26;
/** The certification cap in `src/lib/creative/career-spine.ts`. */
const CERT_CAP = 15;
/** Honors carry a bare year, which has no valid `<time datetime>` (DEVIASI 4). */
const YEAR_ONLY_EVENTS = 3;

test.describe("career spine", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders every event the contract produced, grouped by year", async ({ page }) => {
    const spine = page.locator("#career");

    await expect(spine).toBeVisible();
    // M1.2.4's measured number, pinned against dist.
    await expect(spine.locator("li[data-career-kind]")).toHaveCount(EVENT_COUNT);

    // Per kind, so a change says *which* dataset moved instead of only that
    // something moved.
    const byKind = await spine.locator("li[data-career-kind]").evaluateAll((nodes) => {
      const counts: Record<string, number> = {};
      for (const node of nodes) {
        const kind = node.getAttribute("data-career-kind") ?? "missing";
        counts[kind] = (counts[kind] ?? 0) + 1;
      }
      return counts;
    });
    expect(byKind).toEqual({
      certification: CERT_CAP,
      experience: 7,
      honor: YEAR_ONLY_EVENTS,
      volunteering: 1,
    });
  });

  test("carries no JavaScript at all", async ({ page }) => {
    // The whole point of building the static shape first: this must work with
    // scripting unavailable, so an island here would be a regression, not a
    // feature. M1.3 upgrades the markup in place and is allowed exactly one
    // island here.
    //
    // `inlineHandlers` is not decoration. This assertion was first written
    // counting only `<script>` and `<astro-island>`, and adding an `onclick`
    // to a single card shipped 26 inline handlers into the section while all
    // seven tests stayed green — the exact blind spot Task 0.5 found on
    // `/projects/[slug]`, where a dead control was an inline handler with
    // nothing behind it.
    const counts = await page.locator("#career").evaluate((section) => ({
      scripts: section.querySelectorAll("script").length,
      islands: section.querySelectorAll("astro-island").length,
      inlineHandlers: section.querySelectorAll("*").length
        ? [...section.querySelectorAll("*")].filter((node) =>
            [...node.attributes].some((attribute) => attribute.name.toLowerCase().startsWith("on")),
          ).length
        : 0,
      events: section.querySelectorAll("li[data-career-kind]").length,
    }));
    expect(counts).toEqual({
      scripts: 0,
      islands: 0,
      inlineHandlers: 0,
      events: EVENT_COUNT,
    });
  });

  test("gives every month-precision event a real <time> and the year-only ones none", async ({
    page,
  }) => {
    const shape = await page.locator("#career li[data-career-kind]").evaluateAll((nodes) =>
      nodes.map((node) => ({
        id: node.getAttribute("data-career-id"),
        kind: node.getAttribute("data-career-kind"),
        times: [...node.querySelectorAll("time")].map((time) => time.getAttribute("datetime")),
      })),
    );

    // Nothing padded. A bare year has no valid `<time datetime>`, and inventing
    // January would put a date on the page that nobody wrote down (DEVIASI 4).
    for (const event of shape) {
      for (const value of event.times) {
        expect(value, `${event.id} has a malformed datetime`).toMatch(/^\d{4}-\d{2}$/);
      }
    }

    const dated = shape.filter((event) => event.times.length > 0);
    const undated = shape.filter((event) => event.times.length === 0);

    expect(dated).toHaveLength(EVENT_COUNT - YEAR_ONLY_EVENTS);
    // The three honors are the year-only records; nothing else may lose a date.
    expect(undated.map((event) => event.kind)).toEqual(["honor", "honor", "honor"]);
    for (const event of dated) {
      expect(event.times[0], `${event.id} lost its start date`).toMatch(/^\d{4}-\d{2}$/);
    }
  });

  test("does not repeat a month for a span that starts and ends in one", async ({ page }) => {
    // One real record does this (the AMIKOM volunteering entry, 2025-05 →
    // 2025-05), so printing the end unconditionally would put
    // "May 2025 – May 2025" on the page. Asserted on the text, not on a count.
    const label = await page.locator("#career li[data-career-id^='volunteering-']").innerText();
    expect(label).toContain("May 2025");
    expect(label).not.toMatch(/May 2025\s*–\s*May 2025/);

    // And the ongoing experience keeps its "Present" tail.
    const ongoing = await page
      .locator(
        "#career li[data-career-id='career-exp-ferswit'], #career li[data-career-id='exp-ferswit']",
      )
      .first()
      .innerText();
    expect(ongoing).toContain("Present");
  });

  test("labels each year group with its own heading", async ({ page }) => {
    // M1.2.3. Without this a screen reader announces a bare list of 26 items
    // with no year context at all.
    const groups = await page.locator("#career ol[aria-labelledby]").evaluateAll((nodes) =>
      nodes.map((node) => {
        const id = node.getAttribute("aria-labelledby") ?? "";
        const heading = id ? document.getElementById(id) : null;
        return {
          id,
          text: heading?.textContent?.trim() ?? null,
          level: heading?.tagName ?? null,
          items: node.querySelectorAll(":scope > li[data-career-kind]").length,
        };
      }),
    );

    expect(groups.length).toBeGreaterThan(0);
    for (const group of groups) {
      expect(group.level).toBe("H3");
      expect(group.text).toMatch(/^\d{4}$/);
      expect(group.items).toBeGreaterThan(0);
    }
    // Newest year first, matching `groupEventsByYear` and the ordering the
    // contract test pins.
    const years = groups.map((group) => Number(group.text));
    expect(years).toEqual([...years].sort((a, b) => b - a));
    expect(years.reduce((sum, year) => sum + groups[years.indexOf(year)].items, 0)).toBe(
      EVENT_COUNT,
    );
  });

  test("keeps heading levels in order", async ({ page }) => {
    // `Section.astro` renders the section title as `<h2>` *inside*
    // `<section id="career">`, so the levels in document order run
    // 2, 3, 4, 3, 4, … The plan asked for a `<h4>` year above a `<h3>` title,
    // which is 2 → 4 → 3: a level jumped over and then back.
    //
    // Asserted as "never skips a level" rather than as a fixed level list, so
    // the plan's original ordering fails here: 2 → 4 skips h3, and that is the
    // defect, not the specific replacement.
    const levels = await page
      .locator("#career")
      .evaluate((section) =>
        [...section.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((node) =>
          Number(node.tagName.slice(1)),
        ),
      );

    expect(levels[0]).toBe(2);
    expect(levels.filter((level) => level === 2)).toHaveLength(1);
    expect(levels.filter((level) => level === 3)).toHaveLength(4); // one per year present
    expect(levels.filter((level) => level === 4)).toHaveLength(EVENT_COUNT);

    for (let index = 1; index < levels.length; index += 1) {
      const previous = levels[index - 1];
      const current = levels[index];
      // Going up may only step one level; coming back down is unrestricted.
      expect(current - previous, `level jumped ${previous} → ${current}`).toBeLessThanOrEqual(1);
    }
  });

  test("does not overflow horizontally at 320, 375, or 768", async ({ page }) => {
    for (const width of [320, 375, 768]) {
      await page.setViewportSize({ width, height: 900 });
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        const section = document.querySelector("#career");
        const widest = [...section.querySelectorAll("li[data-career-kind]")].reduce(
          (max, node) => Math.max(max, node.getBoundingClientRect().right),
          0,
        );
        return {
          doc: Math.max(0, doc.scrollWidth - doc.clientWidth),
          beyondViewport: Math.max(0, Math.ceil(widest) - doc.clientWidth),
        };
      });
      expect(overflow.doc, `document overflows at ${width}px`).toBe(0);
      expect(overflow.beyondViewport, `a spine row reaches past ${width}px`).toBe(0);
    }
  });
});
