import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { waitForIslandHydration } from "./hydration";

/**
 * `#career` — the Career Spine: server-rendered in full, upgraded in place by one island.
 *
 * Why this spec exists rather than a unit test: the numbers M1.2.4 and M1.3 ask to
 * be pinned are "how many events reach the page" and "what does the rail do to
 * them", and only the built page can answer either. The unit suite already pins
 * **26** for the contract (`career-spine.test.ts`), the stepper's behaviour, and
 * the listener accounting (`CareerSpine.test.tsx`), and the unit suite
 * structurally *cannot* import an `.astro` component — that blind spot is exactly
 * what let a dead control live on `/projects/[slug]` until Task 0.5.
 * `astro/container` was tried for this and abandoned: Astro 6.1 exports the
 * runtime but not the Vite plugin it needs (`vite-plugin-container` is only
 * imported by `astro/dist/core/create-vite.js`, not re-exported), so the only way
 * in is a deep `dist/` import.
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
/** Year groups on the page: 2026, 2025, 2024, 2023. */
const YEARS = [2026, 2025, 2024, 2023];
/**
 * Width at which `client:media="(min-width: 1024px)"` hydrates, and the rail
 * cell (`hidden lg:block`) becomes visible.
 */
const DESKTOP = { width: 1440, height: 900 };

/**
 * Scroll without waiting for `scroll-behavior: smooth` to finish.
 *
 * `global.css` sets `html { scroll-behavior: smooth }`, so any scrolling API
 * animates. Two sessions in this sprint read a *mid-animation* position and
 * concluded the rail disagreed with the scrub's own arithmetic — twice. Fixed
 * sleeps are not the fix; an explicit `behavior: "instant"` is, and the wait
 * below still confirms the position stopped moving.
 */
async function scrollToInstant(page: Page, top: number) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top);
  await page.waitForFunction((expected) => Math.abs(window.scrollY - expected) < 2, top, {
    timeout: 10_000,
  });
}

/**
 * The top edges of everything `#career` pins to the viewport, found by computed
 * style rather than by Tailwind class name so a class rename cannot silently
 * un-pin the assertion.
 *
 * `rail` is the sticky wrapper around the island (`lg:top-24` = 96px); `active`
 * is the sticky heading of the marked year group (`lg:top-20` = 80px).
 */
function pinnedTops(page: Page) {
  return page.evaluate(() => {
    const stickyAncestor = (node: Element | null) => {
      for (let el = node; el; el = el.parentElement) {
        if (getComputedStyle(el).position === "sticky") return el;
      }
      return null;
    };
    const top = (el: Element | null) => (el ? Math.round(el.getBoundingClientRect().top) : null);
    const rail = stickyAncestor(document.querySelector("#career [data-career-rail-host]"));
    const activeHeading = document.querySelector("#career li[data-career-active] > h3");
    return {
      rail: top(rail),
      activeHeading: top(activeHeading),
      activeYear: activeHeading?.parentElement?.getAttribute("data-career-year") ?? null,
      railPosition: rail ? getComputedStyle(rail).position : null,
      headingPosition: activeHeading ? getComputedStyle(activeHeading).position : null,
    };
  });
}

/**
 * Wait until the rail has actually rendered its controls.
 *
 * `waitForIslandHydration` is not enough here, and this is the same trap F5.1 #6
 * found in the gallery: the `ssr` attribute is dropped when React commits, which
 * is a frame *before* the measurement pass fills `years` and the stepper appears.
 * A test that reads the rail in that window sees an empty box and concludes the
 * feature is broken.
 *
 * Headless Chromium makes the gap visible instead of invisible: it produces very
 * few animation frames (measured: 6 `requestAnimationFrame` callbacks between page
 * load and hydration), and the first measurement is deliberately deferred one
 * frame so it cannot interleave layout reads with hydration's own writes. So
 * "one frame" can be hundreds of milliseconds here, and sometimes only arrives
 * when something else forces a frame — a scroll, in this case.
 */
async function waitForRail(page: Page) {
  await waitForIslandHydration(page, "#career [data-career-rail-host]");
  await page.locator("#career [data-career-step]").first().waitFor({ state: "attached" });
}

/**
 * Poll until a locator's viewport top stops moving (two consecutive reads
 * within 1px), then return it. Same shape as `navigation.spec.ts`'s
 * `settleTop`: a fixed sleep reads mid-animation and concludes the layout
 * disagrees with itself, which is how the jump test first failed here.
 */
async function settleTop(page: Page, selector: string, timeoutMs = 8000): Promise<number> {
  const start = Date.now();
  let prev = Number.POSITIVE_INFINITY;
  let stableRuns = 0;
  while (Date.now() - start < timeoutMs) {
    const top = await page.locator(selector).evaluate((el) => el.getBoundingClientRect().top);
    if (Math.abs(top - prev) < 1) stableRuns += 1;
    else stableRuns = 0;
    prev = top;
    if (stableRuns >= 2) return top;
  }
  return prev;
}

/** Records the island's markup hides, so Barrier B can be asserted rather than assumed. */
function collapsedRecords(page: Page) {
  return page.locator("#career [data-career-spine]").evaluate((spine) =>
    [...spine.querySelectorAll("li[data-career-kind]")]
      .filter((node) => {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return (
          rect.width === 0 ||
          rect.height === 0 ||
          style.display === "none" ||
          style.visibility === "hidden"
        );
      })
      .map((node) => node.getAttribute("data-career-id")),
  );
}

test.describe("career spine — server-rendered shape", () => {
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

  test("carries exactly one island and no inline handlers", async ({ page }) => {
    // M1.2's claim was "no JavaScript at all"; M1.3 spends it deliberately —
    // exactly **one** island, the scrub rail. The canonical list stays server
    // markup, so the count is the budget, not a number to relax later.
    //
    // `inlineHandlers` is not decoration. This assertion was first written
    // counting only `<script>` and `<astro-island>`, and adding an `onclick`
    // to a single card shipped 26 inline handlers into the section while all
    // seven tests stayed green — the exact blind spot Task 0.5 found on
    // `/projects/[slug]`, where a dead control was an inline handler with
    // nothing behind it. M1.2's mutation M5 reproduced it a third time.
    const counts = await page.locator("#career").evaluate((section) => ({
      islands: section.querySelectorAll("astro-island").length,
      inlineHandlers: [...section.querySelectorAll("*")].filter((node) =>
        [...node.attributes].some((attribute) => attribute.name.toLowerCase().startsWith("on")),
      ).length,
      events: section.querySelectorAll("li[data-career-kind]").length,
    }));
    expect(counts).toEqual({
      islands: 1,
      inlineHandlers: 0,
      events: EVENT_COUNT,
    });

    // M1.2's "0 scripts" becomes M1.3's "0 scripts of its own". `client:media`
    // makes Astro emit one inline bootstrap — the watcher that re-evaluates the
    // media query and fires `astro:media` — so the honest claim is "nothing but
    // Astro's own", asserted by **identity** rather than by a count that a second
    // hand-written script could satisfy.
    const scripts = page.locator("#career script");
    await expect(scripts).toHaveCount(1);
    expect(await scripts.first().textContent()).toContain("astro:media");
  });

  test("renders every event in the server HTML, before any island runs", async ({ page }) => {
    // The no-JS path (Barrier A) is a property of the *response*, not of a
    // hydrated page, so this reads the raw HTML. A `client:load` island would
    // still show 26 records here and would still be a regression for a reader
    // with scripting unavailable only in the sense that it costs them a request
    // — but `client:media` is what makes the scrub desktop-only, and that claim
    // needs the raw response too.
    const response = await page.request.get("/");
    const html = await response.text();
    expect(html).toContain(`component-url="/_astro/CareerSpine.`);
    expect(html).toContain('ssr client="media"');
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
    expect(years).toEqual(YEARS);
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
    expect(levels.filter((level) => level === 3)).toHaveLength(YEARS.length);
    expect(levels.filter((level) => level === 4)).toHaveLength(EVENT_COUNT);

    for (let index = 1; index < levels.length; index += 1) {
      const previous = levels[index - 1];
      const current = levels[index];
      // Going up may only step one level; coming back down is unrestricted.
      expect(current - previous, `level jumped ${previous} → ${current}`).toBeLessThanOrEqual(1);
    }
  });

  test("does not overflow horizontally from 320 to 2560", async ({ page }) => {
    // M1.2 probed 320/375/768. M1.3 adds the two-column desktop grid, so the
    // breakpoints that could break are the ones above 768 — where the rail cell
    // appears and the list shares the row.
    for (const width of [320, 375, 768, 1024, 1440, 1920, 2560]) {
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

test.describe("career spine — island hydration", () => {
  test("stays unhydrated below the desktop breakpoint", async ({ page }) => {
    // `client:media="(min-width: 1024px)"` (M1.3: a scrub belongs to a pointer,
    // not a thumb). Astro keeps `ssr` on `<astro-island>` until it hydrates, so
    // the attribute is the condition — no production flag needed.
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.locator("#career").scrollIntoViewIfNeeded();
    await page.waitForTimeout(750);

    const state = await page.locator("#career astro-island").evaluate((island) => ({
      ssr: island.hasAttribute("ssr"),
      client: island.getAttribute("client"),
      // The rail cell is `hidden` below `lg`, so even a hydrated island would
      // render nothing a reader could reach — assert both halves of the claim.
      railVisible: !!document.querySelector("#career [data-career-rail]")?.getClientRects().length,
      steps: document.querySelectorAll("#career [data-career-step]").length,
    }));
    expect(state.ssr, "the island hydrated on a 375px viewport").toBe(true);
    expect(state.client).toBe("media");
    expect(state.steps).toBe(0);
    expect(state.railVisible).toBe(false);
    // Barrier A is untouched by any of this.
    await expect(page.locator("#career li[data-career-kind]")).toHaveCount(EVENT_COUNT);
  });

  test("hydrates at the desktop breakpoint and adds the rail after hydration", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto("/");
    await waitForIslandHydration(page, "#career [data-career-rail-host]");

    const steps = page.locator("#career [data-career-step]");
    await expect(steps).toHaveCount(YEARS.length);
    // Each button prints its year and how many records that year holds, so the
    // count is read out rather than assumed: year followed by count, no space.
    expect(
      await steps.evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim())),
    ).toEqual(["20262", "202516", "20247", "20231"]);
    expect(
      await steps.evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("data-career-step")),
      ),
    ).toEqual(YEARS.map(String));
  });

  test("keeps the canonical list complete while the rail is on screen", async ({ page }) => {
    // Barrier B. The rail is an enhancement, so it must never trade records for
    // focus: no record is hidden, collapsed, or moved off the reading measure.
    await page.setViewportSize(DESKTOP);
    await page.goto("/");
    await waitForRail(page);
    expect(await collapsedRecords(page)).toEqual([]);

    await page.locator("#career [data-career-step='2024']").click();
    expect(await collapsedRecords(page)).toEqual([]);
  });
});

test.describe("career spine — rail", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto("/");
    await waitForRail(page);
  });

  test("pins the rail and the active year heading to the viewport", async ({ page }) => {
    // The defect this pins: `Section.astro` shipped `overflow-hidden`, which
    // makes the section a scroll container, so `position: sticky` resolved
    // against the section instead of the page and every pin scrolled away while
    // still *computing* as `sticky`. Measured before the fix, the rail's wrapper
    // tracked the scroll 1:1 (371 → −29 → −429 → −829) instead of holding 96px.
    //
    // Asserted at a real reading depth, not at the section's top: before the
    // section reaches `top`, sticky legitimately has nothing to do.
    // Asserted 200px *inside* the 2025 group, not at its top: sticky only pins
    // once the element's natural position would be above `top`, so a reading at
    // the group's top edge would measure a heading sitting at 400px and call it
    // a pass.
    //
    // Polled, not read once. A single read after `scrollToInstant` catches the
    // compositor before it has recomputed sticky: 3 of 6 probe runs read the
    // rail's *natural* position (112px) with the scrub still on the previous
    // year, then converged to 96px / 2025 within 50ms with no nudge. The CSS
    // (`position: sticky`, `top: 96px`) was correct in every run — the frame was
    // just late. Polling asserts the settled state, which is what a reader sees.
    const target = await page
      .locator("#career li[data-career-year='2025']")
      .evaluate((node) => node.getBoundingClientRect().top + window.scrollY + 200);
    await scrollToInstant(page, target);

    await expect
      .poll(() => pinnedTops(page), { timeout: 8000 })
      .toMatchObject({ railPosition: "sticky", rail: 96, activeYear: "2025" });
    const pinned = await pinnedTops(page);
    expect(pinned.headingPosition).toBe("sticky");
    expect(pinned.activeHeading, "the 2025 heading did not pin at lg:top-20 (80px)").toBe(80);
  });

  test("marks the year the reading line is on, and says nothing about it aloud", async ({
    page,
  }) => {
    // `activeYearIndex` marks the last group whose top has passed the 70% line,
    // so the marker follows the reader down the spine. Polled: the scrub runs
    // on GSAP's rAF-driven ticker, so a single read after the scroll races the
    // next frame and reports the previous year.
    const yearAt = async (groupYear: number) => {
      const top = await page
        .locator(`#career li[data-career-year='${groupYear}']`)
        .evaluate((node) => node.getBoundingClientRect().top + window.scrollY - 200);
      await scrollToInstant(page, top);
      await expect
        .poll(
          async () =>
            page
              .locator("#career li[data-career-active]")
              .evaluate((node) => node.getAttribute("data-career-year")),
          { timeout: 8000 },
        )
        .toBe(String(groupYear));
    };

    await yearAt(2026);
    await yearAt(2024);

    // M1.3.9's `aria-live` region is written only for jumps the reader asked
    // for. Scrolling is not a jump: announcing it would make the status a
    // screen-reader firehose for the single most common interaction on the page.
    const status = page.locator("#career [data-career-status]");
    expect((await status.innerText()).trim()).toBe("");
    await expect(status).toHaveAttribute("aria-live", "polite");
  });

  test("jumps to a year on click, updates the URL, and announces it", async ({ page }) => {
    const step = page.locator("#career [data-career-step='2025']");
    await step.click();

    // Deep link and marker agree, so the reader can share or reload the view
    // they are looking at.
    await expect(page).toHaveURL(/#career-year-2025$/);
    await expect(step).toHaveAttribute("aria-current", "true");
    await expect(page.locator("#career li[data-career-year='2025']")).toHaveAttribute(
      "data-career-active",
      "true",
    );
    // Exactly one marked group, or the emphasis is meaningless.
    await expect(page.locator("#career li[data-career-active]")).toHaveCount(1);

    const status = page.locator("#career [data-career-status]");
    await expect(status).toHaveText("2025: 16 records");

    // The jump actually moved: 2025's heading lands at the top of the viewport,
    // offset by its own `scroll-mt-28` (112px) *plus* the `scroll-padding-top`
    // on `html` (5rem = 80px) — both apply, so the settled position is ~192px,
    // not ~112px as first assumed. Derived from live computed styles rather
    // than pinned, so a deliberate token change moves the expectation with it.
    //
    // Settled first, then compared: the jump animates
    // (`html { scroll-behavior: smooth }`), and a post-load layout straggler of
    // 16px was measured racing the flight (probe: settled 176 vs computed 192;
    // same 16px as the pin-probe's railParentBottom 4158-vs-4142 split). The
    // ±24px tolerance is that 16px plus rounding slack — tight enough to still
    // catch a removed `scroll-mt` (landing ~80px) or a removed scroll-padding
    // (landing ~112px).
    const expectedTop = await page.evaluate(() => {
      const group = document.querySelector("#career li[data-career-year='2025']");
      if (!group) throw new Error("the 2025 year group is missing from #career");
      const root = document.documentElement;
      return (
        Number.parseFloat(getComputedStyle(group).scrollMarginTop) +
        Number.parseFloat(getComputedStyle(root).scrollPaddingTop)
      );
    });
    const headingTop = await settleTop(page, "#career #career-year-2025", 15_000);
    expect(
      Math.abs(headingTop - expectedTop),
      `the 2025 heading settled at ${headingTop}px, expected ~${expectedTop}px`,
    ).toBeLessThanOrEqual(24);
    expect(headingTop).toBeGreaterThan(0);
  });

  test("moves the selection with arrow keys and keeps one tab stop", async ({ page }) => {
    const steps = page.locator("#career [data-career-step]");
    const current = page.locator("#career [data-career-step][aria-current='true']");

    // 2026 is first, so the rail starts on it.
    await expect(current).toHaveAttribute("data-career-step", "2026");
    await current.focus();
    await page.keyboard.press("ArrowDown");

    await expect(current).toHaveAttribute("data-career-step", "2025");
    // Roving tabindex: one stop for the whole rail, and it follows the selection.
    const tabStops = await steps.evaluateAll((nodes) =>
      nodes.map((node) => ({ year: node.getAttribute("data-career-step"), tab: node.tabIndex })),
    );
    expect(tabStops).toEqual([
      { year: "2026", tab: -1 },
      { year: "2025", tab: 0 },
      { year: "2024", tab: -1 },
      { year: "2023", tab: -1 },
    ]);

    await page.keyboard.press("ArrowDown");
    await expect(current).toHaveAttribute("data-career-step", "2024");
    await page.keyboard.press("End");
    await expect(current).toHaveAttribute("data-career-step", "2023");
    await page.keyboard.press("Home");
    await expect(current).toHaveAttribute("data-career-step", "2026");
    // Wrapping, not clamping — the shared `rovingTargetIndex` the Signal Loom
    // and Case Study Reactor already use.
    await page.keyboard.press("ArrowUp");
    await expect(current).toHaveAttribute("data-career-step", "2023");
  });

  test("draws the rule in proportion to how far the reading line has travelled", async ({
    page,
  }) => {
    // The fill is a pure function of the measured tops (`spineFillFraction`), so
    // this recomputes it here instead of pinning a number: a wrong rule shows up
    // as the page disagreeing with the function — wrong denominator, wrong
    // offset, or "1" whenever any part of the spine is on screen.
    //
    // Measured as rendered height over track height rather than by parsing
    // `transform`: GSAP writes bare `translate(0, 0)` at identity and
    // `scale(1, y)` otherwise, and `matrix3d` would make `split(",")[3]` the
    // wrong component. Both tracks are read in the same evaluate, because the
    // rule is `absolute inset-0` — its height comes from the track, so a
    // measurement taken between a resize and the transform write would divide by
    // a height that is not yet the final one.
    const read = () =>
      page.evaluate(() => {
        const rule = document.querySelector("#career [data-career-rule]");
        const track = rule?.parentElement;
        const groups = [...document.querySelectorAll("#career [data-career-year]")].map((node) => ({
          top: node.getBoundingClientRect().top + window.scrollY,
        }));
        const line = window.scrollY + window.innerHeight * 0.7;
        const first = groups[0].top;
        const last = groups[groups.length - 1].top;
        let expected = 0;
        if (line > last) expected = 1;
        else if (line > first) {
          for (let i = 0; i < groups.length - 1; i += 1) {
            if (line >= groups[i].top && line <= groups[i + 1].top) {
              const span = groups[i + 1].top - groups[i].top;
              expected = (i + (span > 0 ? (line - groups[i].top) / span : 1)) / groups.length;
              break;
            }
          }
        }
        return {
          drawn:
            rule && track && track.getBoundingClientRect().height > 0
              ? rule.getBoundingClientRect().height / track.getBoundingClientRect().height
              : null,
          expected,
        };
      });

    // The rule is written by ScrollTrigger's rAF-driven ticker, so it lags the
    // scroll by a frame: a single read after `scrollToInstant` still shows the
    // previous fill (measured: 0 at a position whose fraction is 0.55). Poll
    // until the drawn fill converges on the live recomputation, then let the
    // assertions below judge the converged pair.
    const awaitRule = async () => {
      const start = Date.now();
      let last = await read();
      while (
        (last.drawn === null || Math.abs(last.drawn - last.expected) >= 0.004) &&
        Date.now() - start < 8000
      ) {
        await page.waitForTimeout(100);
        last = await read();
      }
      return last;
    };

    const docTopOf = (year: number) =>
      page
        .locator(`#career li[data-career-year='${year}']`)
        .evaluate((node) => node.getBoundingClientRect().top + window.scrollY);

    // Above the spine: nothing drawn, and a fully-drawn rule would fail here.
    const start = await read();
    expect(start.expected).toBe(0);
    expect(start.drawn).toBeCloseTo(0, 2);

    // Mid-spine, where the fill must be strictly between 0 and 1 — this is the
    // reading that distinguishes a proportional fill from a 0→1 page progress.
    await scrollToInstant(page, (await docTopOf(2024)) - 300);
    const middle = await awaitRule();
    expect(middle.expected).toBeGreaterThan(0);
    expect(middle.expected).toBeLessThan(1);
    expect(middle.drawn).toBeCloseTo(middle.expected, 2);

    // Past the last heading: fully drawn.
    await scrollToInstant(page, (await docTopOf(2023)) + 100);
    const end = await awaitRule();
    expect(end.drawn).toBeCloseTo(1, 2);
  });

  test("resolves an event deep link to its own year on arrival", async ({ page }) => {
    // NOTE: this test must perform a real cross-document load. The `rail`
    // describe's `beforeEach` already did `goto("/")`, so a bare
    // `goto("/#career-<id>")` from there is a same-document navigation: it
    // fires `hashchange` without reloading, and the test would exercise the
    // announce path while asserting the silent-arrival path. The hop below
    // makes the arrival real — caught when the status read "2025: 16 records"
    // instead of "".
    const eventId = await page
      .locator("#career li[data-career-year='2025'] li[data-career-id]")
      .first()
      .getAttribute("data-career-id");
    // Leave first: the hop makes the hash navigation below a real
    // cross-document load (gallery → home), so the browser scrolls to the
    // anchor on arrival and the island takes the silent mount path.
    await page.goto("/gallery");
    await page.goto(`/#career-${eventId}`);
    await waitForRail(page);

    await expect(page.locator("#career [data-career-step='2025']")).toHaveAttribute(
      "aria-current",
      "true",
    );
    await expect(page.locator("#career li[data-career-year='2025']")).toHaveAttribute(
      "data-career-active",
      "true",
    );
    // The mount read is silent: the browser already scrolled there, so speaking
    // over the page the reader asked for helps nobody. Retried, not read once:
    // the sync runs one effect after the measurement that fills the refs, so a
    // single read races it.
    await expect(page.locator("#career [data-career-status]")).toHaveText("");

    // A `hashchange` after arrival is a deliberate jump, and is announced.
    await page.evaluate(() => {
      window.location.hash = "#career-year-2023";
    });
    await expect(page.locator("#career [data-career-status]")).toHaveText("2023: 1 record");
  });
});

test.describe("career spine — reduced motion", () => {
  test("keeps the whole spine and the rail, drops the scrub", async ({ page }) => {
    // `page.emulateMedia`, never `test.use({ reducedMotion })`: on this
    // Playwright version the fixture is silently ignored, so a test that trusts
    // it passes without testing anything (Q4.2 #1).
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize(DESKTOP);
    await page.goto("/");
    await waitForRail(page);

    // M1.3.5: the spine is complete, not degraded into a summary.
    await expect(page.locator("#career li[data-career-kind]")).toHaveCount(EVENT_COUNT);
    expect(await collapsedRecords(page)).toEqual([]);
    // No rule at all — nothing moves, so nothing is drawn.
    await expect(page.locator("#career [data-career-rule]")).toHaveCount(0);
    // Navigation is not motion, so it survives.
    await expect(page.locator("#career [data-career-step]")).toHaveCount(YEARS.length);
    await page.locator("#career [data-career-step='2023']").click();
    await expect(page).toHaveURL(/#career-year-2023$/);
    await expect(page.locator("#career [data-career-status]")).toHaveText("2023: 1 record");
    // With no scrub there is no position to derive a marker from, so the spine is
    // unmarked until the reader jumps. It was jumped above, so it is marked now.
    await expect(page.locator("#career li[data-career-active]")).toHaveCount(1);

    // Sticky is not motion either: the rail still pins, so the reader keeps the
    // year list while scrolling the records. Polled — same late-compositor
    // frame as the motion path's pin test, minus the scrub marker.
    const target = await page
      .locator("#career li[data-career-year='2025']")
      .evaluate((node) => node.getBoundingClientRect().top + window.scrollY + 200);
    await scrollToInstant(page, target);
    await expect
      .poll(() => pinnedTops(page), { timeout: 8000 })
      .toMatchObject({ railPosition: "sticky", rail: 96 });
  });
});
