import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

/**
 * MOTION-01 — chapter reveal contract, verified on the built page.
 *
 * MOTION-19 cut the home to six sections, five of them chapters: flagship work,
 * how I work, the journey, the lab teaser and contact. The hero is deliberately
 * not a chapter (it has its own island-driven entrance), and every chapter now
 * has a title, so the "untitled `#github` chapter" case this spec used to cover
 * lives on `/data` instead.
 *
 * Better-known lesson first (Q4.2 #1): `test.use({ reducedMotion })` is
 * silently ignored on this Playwright version, so every preference test
 * emulates the media and reads `matchMedia` back — positive and negative
 * controls in the same assertion.
 *
 * The `@supports`-safety half of the contract cannot be emulated in Chromium
 * (it is the only engine Under Test, and it supports scroll-driven
 * animations); that rule is enforced by the source guard in
 * `src/lib/scroll-animations.guard.test.ts`.
 */

/** Chapters on the home, in document order. The hero is not one. */
const CHAPTERS = ["projects", "systems-in-motion", "journey", "creative-lab", "contact"];

/** Head/body accessor for a chapter's computed beats. */
function beats(page: Page, sectionId: string) {
  return page.locator(`#${sectionId}`).evaluate((section) => {
    const beat = (hook: string) => {
      const el = section.querySelector(`[${hook}]`);
      if (!el) return null;
      const style = getComputedStyle(el);
      return {
        animationName: style.animationName,
        animationRange: style.animationRange,
        animationTimeline: style.animationTimeline,
        opacity: style.opacity,
        transform: style.transform,
      };
    };
    const head = section.querySelector("[data-chapter-head]");
    const body = section.querySelector("[data-chapter-body]");
    return {
      head: beat("data-chapter-head"),
      body: beat("data-chapter-body"),
      headBeforeBody:
        head && body
          ? Boolean(head.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING)
          : null,
    };
  });
}

test.describe("chapter markup (MOTION-01)", () => {
  test("exposes five chapters, every one titled and head before body", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });

    const chapters = page.locator("main > section[data-chapter]");
    await expect(chapters).toHaveCount(CHAPTERS.length);

    const hooks = await page.evaluate(() =>
      [...document.querySelectorAll("main > section[data-chapter]")].map((section) => ({
        id: section.id,
        heads: section.querySelectorAll("[data-chapter-head]").length,
        bodies: section.querySelectorAll("[data-chapter-body]").length,
      })),
    );

    // Every chapter is `Section chapter title=…`, so each gets exactly one head
    // and one body. The old "eight titled + one untitled" split belonged to the
    // GitHub chapter that now lives on `/data`.
    expect(hooks.map((chapter) => chapter.id)).toEqual(CHAPTERS);
    for (const chapter of hooks) {
      expect(chapter.heads, `${chapter.id}: one head`).toBe(1);
      expect(chapter.bodies, `${chapter.id}: one body`).toBe(1);
    }

    for (const sectionId of CHAPTERS) {
      const chapter = await beats(page, sectionId);
      expect(chapter.headBeforeBody, `${sectionId}: head before body`).toBe(true);
    }
  });
});

test.describe("chapter animation ranges", () => {
  test("head settles before the body: different, ordered ranges", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });

    // `#contact` is the one chapter whose body still owns the block beat:
    // the project grid, the career spine and the lab sheet each opt out so their
    // children can animate individually (MOTION-03/04/07).
    const chapter = await beats(page, "contact");
    expect(chapter.head?.animationTimeline).toBe("view()");
    expect(chapter.body?.animationTimeline).toBe("view()");
    expect(chapter.head?.animationName).toBe("reveal-fade-up");
    expect(chapter.body?.animationName).toBe("reveal-fade-up-body");
    expect(chapter.head?.animationRange).not.toBe(chapter.body?.animationRange);
    // Head starts before the body: `entry` (0%) vs `entry 12%`.
    expect(chapter.head?.animationRange).toBe("entry entry 45%");
    expect(chapter.body?.animationRange).toBe("entry 12% entry 78%");
  });

  test("scrolling past a chapter settles it fully (no stuck-hidden content)", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    // `#contact` closes the document: two viewport heights past its start can
    // only be past its entry range, so a reader who kept scrolling always
    // reaches the settled state.
    await page
      .locator("#contact")
      .evaluate((el) => el.scrollIntoView({ behavior: "instant", block: "start" }));
    await page.evaluate(() =>
      window.scrollBy({ top: window.innerHeight * 2, behavior: "instant" }),
    );
    await page.waitForTimeout(300);

    const chapter = await beats(page, "contact");
    expect(chapter.head?.opacity).toBe("1");
    expect(chapter.body?.opacity).toBe("1");
    expect(chapter.head?.transform).toBe("matrix(1, 0, 0, 1, 0, 0)");
    expect(chapter.body?.transform).toBe("matrix(1, 0, 0, 1, 0, 0)");
  });
});

test.describe("reduced motion is a real off switch", () => {
  test("positive control: chapter beats and the bar are static", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/", { waitUntil: "load" });
    expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(
      true,
    );

    const chapter = await beats(page, "contact");
    for (const [beat, expectation] of [
      ["head", chapter.head],
      ["body", chapter.body],
    ] as const) {
      expect(expectation?.animationName, `${beat} animation off`).toBe("none");
      expect(expectation?.opacity, `${beat} fully visible`).toBe("1");
      expect(expectation?.transform, `${beat} untransformed`).toBe("none");
    }

    const bar = await page.evaluate(() => {
      const el = document.querySelector(".scroll-progress-css");
      if (!el) return null;
      const style = getComputedStyle(el);
      return {
        animationName: style.animationName,
        transform: style.transform,
        ariaHidden: el.getAttribute("aria-hidden"),
        role: el.getAttribute("role"),
      };
    });
    expect(bar).not.toBeNull();
    expect(bar?.animationName).toBe("none");
    expect(bar?.ariaHidden).toBe("true");
    expect(bar?.role).toBe(null);
  });

  test("negative control: normal motion keeps the reveal", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/", { waitUntil: "load" });
    expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(
      false,
    );

    const chapter = await beats(page, "contact");
    expect(chapter.head?.animationName).toBe("reveal-fade-up");
    expect(chapter.body?.animationName).toBe("reveal-fade-up-body");
  });

  test("reduced data: static content where the engine supports the query", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-data", value: "reduce" }],
    });
    await page.goto("/", { waitUntil: "load" });
    const matches = await page.evaluate(() => matchMedia("(prefers-reduced-data: reduce)").matches);

    // Chromium (the only engine this suite runs) does not implement the query,
    // so the equivalent static path cannot be observed here. Skip honestly and
    // let the source guard hold the CSS rule in place.
    test.skip(matches === false, "Chromium does not emulate prefers-reduced-data");

    const chapter = await beats(page, "contact");
    expect(chapter.head?.animationName).toBe("none");
    expect(chapter.body?.animationName).toBe("none");
    await context.close();
  });
});

test.describe("scroll progress bar (MOTION-01)", () => {
  test("compositor-only: layout width is constant, the transform moves", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });

    const bar = () =>
      page.evaluate(() => {
        const el = document.querySelector(".scroll-progress-css");
        if (!el) return null;
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          styleWidth: style.width,
          transform: style.transform,
          role: el.getAttribute("role"),
          hidden: el.getAttribute("aria-hidden"),
          animationName: style.animationName,
          animationTimeline: style.animationTimeline,
          scrollY: window.scrollY,
          rectWidth: rect.width,
        };
      });

    const atTop = await bar();
    expect(atTop).not.toBeNull();
    expect(atTop?.role).toBe(null);
    expect(atTop?.hidden).toBe("true");
    expect(atTop?.animationName).toBe("progress-grow");
    expect(atTop?.animationTimeline).toBe("scroll(root)");
    expect(atTop?.transform).toBe("matrix(0, 0, 0, 1, 0, 0)");

    await page.evaluate(() =>
      window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }),
    );
    await page.waitForTimeout(400);

    const atBottom = await bar();
    expect(atBottom?.styleWidth).toBe(atTop?.styleWidth); // no width animation
    expect(atBottom?.transform).toBe("matrix(1, 0, 0, 1, 0, 0)");
    expect(atBottom?.scrollY).toBeGreaterThan(0);
  });
});

test.describe("no-JS readers", () => {
  test("chapters exist and their content is present", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/", { waitUntil: "load" });

    await expect(page.locator("main > section[data-chapter]")).toHaveCount(CHAPTERS.length);
    // MOTION-19 replaced the removed About prose with the journey chapter: the
    // career records and the link to the full record are server markup, so a
    // reader without JavaScript still gets the six contributions.
    const journey = page.locator("#journey [data-chapter-body]");
    expect(await journey.textContent()).toContain("The full career record");
    await expect(page.locator("#journey li[data-career-kind]")).toHaveCount(6);
    await context.close();
  });
});
