import { expect, test } from "@playwright/test";
import { LAB_CATEGORIES, LAB_EXPERIMENTS } from "../src/lib/lab-registry";
import { waitForExperimentReady } from "./hydration";

const SECTION = "#creative-lab";
const COUNT = `${SECTION} [data-lab-count]`;
const GROUPS = `${SECTION} [data-lab-group]`;
const CARDS = `${SECTION} [data-lab-card]`;

/**
 * The Creative Lab contact sheet (Task 2.5) — the homepage advertises the lab's
 * *entire* catalog in server HTML, fixing PRD I4 where 4 of the 27 experiments
 * were invisible from the homepage. The unit tests pin the registry↔gallery
 * join and the SiteFacts counts in isolation; this spec covers what jsdom
 * structurally cannot:
 *
 * 1. **The built page agrees with the registry.** `facts.lab` counts and
 *    `lab-gallery.ts` cards meet only in the rendered HTML; 27 in one file and
 *    4 in another would both be self-consistent unless something compares them.
 *    Every count below is imported from `lab-registry.ts` (a zero-dependency
 *    module) so the test re-reads the same source — no literal to go stale.
 * 2. **The section carries no JavaScript.** "Zero JS" is a claim that must be
 *    *counted* (M1.2, mutation M5): Astro copies inline `on*` handlers into the
 *    output unescaped, so an island count alone can lie.
 * 3. **A thumbnail really opens the experiment it advertises**, through the
 *    public path a reader would use — click, not a shortcut that skips the
 *    contact sheet.
 *
 * The counts are absolute (not "agree with the header") because a self-consistent
 * reduction back to 4 cards would be the exact defect this task deletes.
 */

test.describe("creative lab contact sheet", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders every lab experiment as a unique deep link", async ({ page }) => {
    const cards = page.locator(CARDS);
    await expect(cards.first()).toBeAttached();
    expect(await cards.count()).toBe(LAB_EXPERIMENTS.length);

    // The header prints the same source (`SiteFacts.lab.count`) the rest of the
    // site cites, so it must agree with the cards rendered below it.
    await expect(page.locator(COUNT)).toHaveText(String(LAB_EXPERIMENTS.length));

    // Every card deep-links into the lab, and each id appears exactly once.
    const hrefs = await cards.evaluateAll((nodes) => nodes.map((n) => n.getAttribute("href")));
    expect(hrefs.every((h) => /^\/lab#[a-z0-9-]+$/.test(h ?? ""))).toBe(true);
    expect(new Set(hrefs).size).toBe(hrefs.length);

    // The header CTA is the section's second escape hatch; a missing or wrong
    // href would be a dead control (Task 0.5).
    await expect(page.locator(`${SECTION} a[href='/lab']`)).toHaveCount(1);
  });

  test("header, category rows and cards all count the same catalog", async ({ page }) => {
    const stats = await page.locator(SECTION).evaluate((section) => {
      const header = Number(section.querySelector("[data-lab-count]")?.textContent ?? "");
      const groups = [...section.querySelectorAll("[data-lab-group]")].map((g) => {
        const details = g instanceof HTMLDetailsElement ? g : null;
        return {
          claimed: Number(g.querySelector("[data-lab-group-count]")?.textContent ?? ""),
          cards: g.querySelectorAll("[data-lab-card]").length,
          open: details ? details.open : false,
        };
      });
      return { header, groups };
    });

    expect(stats.header).toBe(LAB_EXPERIMENTS.length);
    // One collapsible per declared category; zero-count categories are omitted
    // by the facts builder (Rule 12), and all five have cards today.
    expect(stats.groups.length).toBe(LAB_CATEGORIES.length);
    const total = stats.groups.reduce((sum, g) => sum + g.claimed, 0);
    expect(total).toBe(stats.header);
    for (const g of stats.groups) {
      expect(g.claimed).toBe(g.cards);
      // Default-open: the sheet is a contact sheet until a reader collapses it.
      expect(g.open).toBe(true);
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

  test("every thumbnail is lazy and decorative", async ({ page }) => {
    const imgs = page.locator(`${CARDS} img`);
    expect(await imgs.count()).toBe(LAB_EXPERIMENTS.length);
    const attrs = await imgs.evaluateAll((nodes) =>
      nodes.map((n) => ({
        loading: n.getAttribute("loading"),
        decoding: n.getAttribute("decoding"),
        alt: n.getAttribute("alt"),
        src: n.getAttribute("src"),
      })),
    );
    for (const a of attrs) {
      expect(a.loading).toBe("lazy");
      expect(a.decoding).toBe("async");
      // Decorative: each image sits inside a link whose text names the
      // experiment, so `alt=""` is the WCAG-correct role (Task 2.5).
      expect(a.alt).toBe("");
      expect(a.src).toMatch(/^\/images\/experiments\/.+\.svg$/);
    }
  });

  test("a thumbnail opens the experiment it advertises", async ({ page }) => {
    const card = page.locator(CARDS).first();
    const href = (await card.getAttribute("href")) ?? "";
    const title = ((await card.locator("span").textContent()) ?? "").trim();
    expect(href).toMatch(/^\/lab#[a-z0-9-]+$/);
    expect(title).not.toBe("");

    await card.click();
    await page.waitForURL((url) => url.pathname === "/lab" && url.hash.length > 1);
    await expect(page).toHaveURL(href);
    await waitForExperimentReady(page);
    // The title lives in the modal panel header, outside `[data-modal-content]`
    // (which is the experiment body itself), so assert on the panel.
    await expect(page.locator("[data-modal-panel]")).toContainText(title);
  });

  /**
   * MOTION-07. Before the change the sheet was one chapter-body rectangle:
   * measured opacity 0 → 0.27 → 0.77 → 1 across 810 px of scroll, and all 27
   * cards shared whatever value the body had. The assertions below are the
   * shape of the fix, not a restatement of the CSS: the body is settled, every
   * thumbnail owns a `view()` beat, and the order token sequences each group's
   * cards by data order.
   */
  test("settles the sheet as an index instead of one rectangle", async ({ page }) => {
    const state = await page.evaluate(() => {
      const section = document.querySelector("#creative-lab") as HTMLElement;
      const read = (el: HTMLElement) => {
        const css = getComputedStyle(el);
        return {
          name: css.animationName,
          timeline: css.animationTimeline,
          range: css.animationRange,
          opacity: css.opacity,
        };
      };
      const body = section.querySelector("[data-chapter-body]") as HTMLElement;
      const headings = [...section.querySelectorAll("[data-lab-group-reveal]")] as HTMLElement[];
      const cards = [...section.querySelectorAll("[data-lab-card-reveal]")] as HTMLElement[];
      return {
        body: read(body),
        headings: headings.map(read),
        cards: cards.map((el) => ({
          ...read(el),
          order: el.style.getPropertyValue("--lab-card-order"),
        })),
        groups: [...section.querySelectorAll("[data-lab-group]")].map((group) => ({
          heading: group.querySelector("[data-lab-group-reveal]")
            ? getComputedStyle(group.querySelector("[data-lab-group-reveal]") as HTMLElement)
                .animationName
            : null,
          orders: [...group.querySelectorAll("[data-lab-card-reveal]")].map((el) =>
            (el as HTMLElement).style.getPropertyValue("--lab-card-order"),
          ),
        })),
      };
    });

    // The chapter body is out of the single-beat reveal …
    expect(state.body.name).toBe("none");
    expect(state.body.opacity).toBe("1");

    // … every heading and thumbnail owns a beat on its own view timeline …
    expect(state.headings).toHaveLength(LAB_CATEGORIES.length);
    for (const heading of state.headings) expect(heading.name).toBe("reveal-fade-up");
    expect(state.cards.length).toBe(LAB_EXPERIMENTS.length);
    for (const card of state.cards) {
      expect(card.name).toBe("reveal-fade-up");
      expect(card.timeline).toBe("view()");
    }

    // … and the order token, not `:nth-child`, sequences a group's cards.
    for (const group of state.groups) {
      const expected = Array.from({ length: group.orders.length }, (_, i) => String(i));
      expect(group.orders).toEqual(expected);
    }
    const distinctRanges = new Set(state.cards.map((c) => c.range));
    expect(distinctRanges.size).toBeGreaterThanOrEqual(LAB_CATEGORIES.length);
  });

  test("reduced motion shows the full sheet immediately", async ({ page }) => {
    // `test.use({ reducedMotion })` is silently ignored in this Playwright
    // version, so emulate and read the preference back (positive control).
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(
      true,
    );

    const states = await page.evaluate(() => {
      const section = document.querySelector("#creative-lab") as HTMLElement;
      const read = (el: HTMLElement) => {
        const css = getComputedStyle(el);
        return { name: css.animationName, opacity: css.opacity, transform: css.transform };
      };
      const nodes = [
        section.querySelector("[data-chapter-body]"),
        ...section.querySelectorAll("[data-lab-group-reveal]"),
        ...section.querySelectorAll("[data-lab-card-reveal]"),
      ] as HTMLElement[];
      return nodes.map(read);
    });

    // Nothing is scrolled and nothing is hidden: the sheet is a printed index.
    expect(states).toHaveLength(1 + LAB_CATEGORIES.length + LAB_EXPERIMENTS.length);
    for (const state of states) {
      expect(state).toEqual({ name: "none", opacity: "1", transform: "none" });
    }
  });
});
