import { type Page, expect, test } from "@playwright/test";

/**
 * Q4.3 — navigation hierarchy on `/`.
 *
 * The home page used to render a second navigation in the top-right corner
 * (`MorphingNavigation`): dots below 100px of scroll, a text list below 300px,
 * and a hamburger button past 600px. It duplicated the header nav, duplicated
 * the right-middle position readout, and — measured in Chromium at 375x812 —
 * its hamburger at x=311,y=24 was painted on top of the header theme toggle at
 * x=319,y=12. It is removed from the markup, not hidden.
 *
 * Every assertion below is pinned to one of those measurements.
 */

/**
 * Poll until the target's viewport top stops moving (two consecutive reads
 * within 1px), then return it. The old fixed `waitForTimeout(1200)` missed
 * fast scrolls on this machine — the section top was still 138px when the
 * page had already settled ~80px. Polling removes the timing assumption
 * without loosening the <120px assertion.
 */
const settleTop = async (page: Page, selector: string, timeoutMs = 5000): Promise<number> => {
  const start = Date.now();
  let prev = Number.POSITIVE_INFINITY;
  let stableRuns = 0;
  while (Date.now() - start < timeoutMs) {
    const top = await page.locator(selector).evaluate((el) => el.getBoundingClientRect().top);
    if (Math.abs(top - prev) < 1) stableRuns += 1;
    else stableRuns = 0;
    prev = top;
    if (stableRuns >= 2) return top;
    await page.waitForTimeout(100);
  }
  return prev;
};

/**
 * Interactive controls painted inside the header band that are NOT the header's
 * own. The removed morphing nav contributed one here on every viewport: a
 * hamburger at (1378,16) on desktop, over the theme toggle on mobile.
 */
const foreignControlsInHeaderBand = (page: Page) =>
  page.evaluate(() => {
    const out: { name: string; x: number; y: number }[] = [];
    for (const el of document.querySelectorAll<HTMLElement>("a,button")) {
      if (el.closest("header")) continue;
      const s = window.getComputedStyle(el);
      if (s.display === "none" || s.visibility === "hidden") continue;
      if (el.closest("[aria-hidden='true']")) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.top < 0 || r.top > 70) continue;
      out.push({
        name: (el.getAttribute("aria-label") ?? el.textContent ?? "").trim().replace(/\s+/g, " "),
        x: Math.round(r.x),
        y: Math.round(r.y),
      });
    }
    return out;
  });

test.describe("Navigation hierarchy — one primary nav, one position readout", () => {
  test("the home page renders exactly the header's two navs, not a third", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("load");

    // Primary (desktop list) + Mobile (burger sheet). The removed nav was #3.
    await expect(page.locator("nav")).toHaveCount(2);
    await expect(page.locator("nav[aria-label='Primary']")).toHaveCount(1);
    await expect(page.locator("nav[aria-label='Mobile']")).toHaveCount(1);

    // Nothing in the old nav's markup survives in the DOM either.
    await expect(page.locator("nav.fixed")).toHaveCount(0);
  });

  test("past the old 600px threshold no extra control is painted over the header", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForTimeout(600);

    // Before: a second hamburger at (1378,16) on desktop.
    expect(await foreignControlsInHeaderBand(page)).toEqual([]);

    // The header's own menu affordance is still the only one, and it works.
    const gameMenu = page.getByRole("button", { name: "Open Menu", exact: true });
    await expect(gameMenu).toBeVisible();
    await gameMenu.click();
    await expect(page.getByRole("dialog", { name: /Game|Lab|Panel|Menu/i }).first()).toBeVisible();
    await page.keyboard.press("Escape");
  });

  test("the position readout is the single secondary indicator and counts real sections", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForTimeout(400);

    const counter = page.locator("[data-section-counter]");
    await expect(counter).toHaveCount(1);

    // It reported "01 / 11" on a 14-section page: `systems-in-motion` and
    // `testimonials` were missing because the id list was hard-coded inside the
    // component instead of coming from the page that renders the sections.
    //
    // 13, not 14: the fabricated testimonials section was removed in Task 0.3.
    const sectionCount = await page.locator("section[id]").count();
    expect(sectionCount).toBe(13);
    await expect(counter.locator("[data-section-dot]")).toHaveCount(sectionCount);
    await expect(counter).toHaveText(`01 / ${String(sectionCount).padStart(2, "0")}`);

    // Decorative: it duplicates section landmarks, and the old 11 `aria-label`s
    // on role=generic dots were prohibited by ARIA 1.2.
    await expect(counter).toHaveAttribute("aria-hidden", "true");
    expect(await counter.locator("[aria-label]").count()).toBe(0);
    await expect(counter).toHaveCSS("pointer-events", "none");
  });

  test("the readout tracks scrolling, and the header nav still drives section jumps", async ({
    page,
  }) => {
    await page.goto("/");
    const counter = page.locator("[data-section-counter]");
    const start = await counter.textContent();
    expect(start?.trim()).toBe("01 / 13");

    await page.locator("nav[aria-label='Primary'] a[href='/#projects']").click();
    const top = await settleTop(page, "#projects");

    // #projects sits under the 65px fixed header, so its top settles just above 0.
    expect(Math.abs(top)).toBeLessThan(120);

    const after = counter.textContent();
    expect((await after)?.trim()).not.toBe("01 / 13");
    // projects is the 6th declared section (hero, about, systems-in-motion,
    // experience, journey, projects). The IntersectionObserver path can stall
    // >5s under memory pressure on this 3 GB machine (Q4.2), so give the
    // auto-retrying assertion a larger budget — the expected value is exact.
    await expect(counter).toHaveText("06 / 13", { timeout: 15000 });
  });
});

test.describe("Navigation hierarchy — below lg", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("no overlay control collides with the header, and the burger sheet still navigates", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForTimeout(400);

    // Before: dots at (343,24) then a hamburger at (311,24) — both on top of the
    // header theme toggle at (319,12), and a 7-item text list at (278,24) in the
    // 100–300px band. All three states are covered by scrolling past 600px.
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForTimeout(600);
    expect(await foreignControlsInHeaderBand(page)).toEqual([]);

    // The readout is a desktop-only affordance (hidden lg:flex), unchanged.
    await expect(page.locator("[data-section-counter]")).toBeHidden();

    // Responsive menu: open, navigate to a section, sheet closes.
    const trigger = page.getByRole("button", { name: "Menu", exact: true });
    await expect(trigger).toBeVisible();
    await trigger.click();
    const sheet = page.getByRole("dialog", { name: "Menu navigasi", exact: true });
    await expect(sheet).toBeVisible();
    await sheet.getByRole("link", { name: "Projects", exact: true }).click();
    const mobileTop = await settleTop(page, "#projects");
    await expect(sheet).toBeHidden();
    expect(mobileTop).toBeLessThan(120);
  });
});
