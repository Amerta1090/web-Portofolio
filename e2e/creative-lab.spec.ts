import { expect, test } from "@playwright/test";
import { LAB_CATEGORIES, LAB_EXPERIMENTS } from "../src/lib/lab-registry";
import { buildLabTeaser } from "../src/lib/lab-teaser";
import { waitForExperimentReady } from "./hydration";

const SECTION = "#creative-lab";
const PICKS = `${SECTION} [data-lab-picks]`;
const COUNT = `${SECTION} [data-lab-count]`;
const CARDS = `${SECTION} [data-lab-card]`;

/** The six picks the server made, from the same rule the page uses. */
const TEASER = buildLabTeaser();

/**
 * The Creative Lab teaser (Prove It Task 2.5; cut to six in MOTION-19).
 *
 * MOTION-19 shrank this from a 27-card contact sheet to a teaser: the home
 * advertises the lab, `/lab` carries the catalog. What must still hold:
 *
 * 1. **The built page agrees with the selection rule.** `buildLabTeaser()` is
 *    imported here, so "six cards" cannot drift into "five" or "all 27"
 *    without this file going red. The printed `data-lab-count` stays the
 *    *catalog* size (`LAB_EXPERIMENTS.length`), because the copy says
 *    "6 of 27" — two different numbers, both derived.
 * 2. **The section carries no JavaScript.** "Zero JS" is a claim that must be
 *    *counted* (M1.2, mutation M5): Astro copies inline `on*` handlers into the
 *    output unescaped, so an island count alone can lie.
 * 3. **A thumbnail really opens the experiment it advertises**, through the
 *    public path a reader would use — click, not a shortcut that skips the
 *    teaser.
 *
 * The counts are absolute (not "agree with the header") because a
 * self-consistent shrink back to four cards would be the defect Task 2.5
 * deleted, and a self-consistent regrowth to 27 is the chapter budget
 * MOTION-19 protects.
 */

test.describe("creative lab teaser", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders the six picks as unique deep links", async ({ page }) => {
    const cards = page.locator(CARDS);
    await expect(cards.first()).toBeAttached();
    expect(await cards.count()).toBe(TEASER.length);
    // The owner-approved shape: one per category plus one flagship.
    expect(TEASER.length).toBe(LAB_CATEGORIES.length + 1);

    // "6 of 27": the picks counter and the catalog counter print different
    // sources, so both are pinned against the modules, not against each other.
    await expect(page.locator(PICKS)).toHaveText(String(TEASER.length));
    await expect(page.locator(COUNT)).toHaveText(String(LAB_EXPERIMENTS.length));

    // Every card deep-links into the lab, in selection order, each id once.
    const hrefs = await cards.evaluateAll((nodes) => nodes.map((n) => n.getAttribute("href")));
    expect(hrefs).toEqual(TEASER.map((exp) => `/lab#${exp.id}`));
    expect(new Set(hrefs).size).toBe(hrefs.length);

    // The header CTA is the section's escape hatch; a missing or wrong href
    // would be a dead control (Task 0.5).
    await expect(page.locator(`${SECTION} a[href='/lab']`)).toHaveCount(1);
  });

  test("teases one experiment per category instead of grouping all of them", async ({ page }) => {
    const state = await page.evaluate(() => {
      const section = document.querySelector("#creative-lab") as HTMLElement;
      const cards = [...section.querySelectorAll("[data-lab-card]")];
      return {
        categories: cards.map((c) => c.getAttribute("data-lab-category")),
        groups: section.querySelectorAll("[data-lab-group]").length,
        details: section.querySelectorAll("details").length,
      };
    });

    // Every declared category is represented exactly once, plus the flagship.
    expect(state.categories.slice(0, LAB_CATEGORIES.length)).toEqual(LAB_CATEGORIES);
    expect(new Set(state.categories).size).toBe(LAB_CATEGORIES.length);
    // The five collapsible category rows belonged to the 27-card sheet.
    expect(state.groups).toBe(0);
    expect(state.details).toBe(0);
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
    expect(await imgs.count()).toBe(TEASER.length);
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
    const title = ((await card.locator("span").first().textContent()) ?? "").trim();
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
   * MOTION-07 presentation, kept through the cut. The chapter body must stay
   * out of its single-beat reveal (otherwise the whole teaser fades as one
   * rectangle and no card can read as settled), each thumbnail owns a `view()`
   * beat, and `--lab-card-order` — emitted from the selection order — is what
   * sequences them, never `:nth-child` (the MOTION-03 trap).
   */
  test("settles the teaser as an index instead of one rectangle", async ({ page }) => {
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
      const cards = [...section.querySelectorAll("[data-lab-card-reveal]")] as HTMLElement[];
      return {
        body: read(body),
        cards: cards.map((el) => ({
          ...read(el),
          order: el.style.getPropertyValue("--lab-card-order"),
        })),
      };
    });

    // The chapter body is out of the single-beat reveal …
    expect(state.body.name).toBe("none");
    expect(state.body.opacity).toBe("1");

    // … every thumbnail owns a beat on its own view timeline …
    expect(state.cards).toHaveLength(TEASER.length);
    for (const card of state.cards) {
      expect(card.name).toBe("reveal-fade-up");
      expect(card.timeline).toBe("view()");
    }

    // … and the order token, not `:nth-child`, sequences them.
    expect(state.cards.map((c) => c.order)).toEqual(TEASER.map((_, i) => String(i)));
    expect(new Set(state.cards.map((c) => c.range)).size).toBe(TEASER.length);
  });

  test("reduced motion shows the full teaser immediately", async ({ page }) => {
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
        ...section.querySelectorAll("[data-lab-card-reveal]"),
      ] as HTMLElement[];
      return nodes.map(read);
    });

    // Nothing is scrolled and nothing is hidden: the teaser is a printed index.
    expect(states).toHaveLength(1 + TEASER.length);
    for (const state of states) {
      expect(state).toEqual({ name: "none", opacity: "1", transform: "none" });
    }
  });
});
