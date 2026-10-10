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
    expect(hrefs.every((h) => /^\/gallery#[a-z0-9-]+$/.test(h ?? ""))).toBe(true);
    expect(new Set(hrefs).size).toBe(hrefs.length);

    // The header CTA is the section's second escape hatch; a missing or wrong
    // href would be a dead control (Task 0.5).
    await expect(page.locator(`${SECTION} a[href='/gallery']`)).toHaveCount(1);
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
    expect(href).toMatch(/^\/gallery#[a-z0-9-]+$/);
    expect(title).not.toBe("");

    await card.click();
    await page.waitForURL((url) => url.pathname === "/gallery" && url.hash.length > 1);
    await expect(page).toHaveURL(href);
    await waitForExperimentReady(page);
    // The title lives in the modal panel header, outside `[data-modal-content]`
    // (which is the experiment body itself), so assert on the panel.
    await expect(page.locator("[data-modal-panel]")).toContainText(title);
  });
});
