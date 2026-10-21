import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

/**
 * MOTION-01 — chapter reveal contract, verified on the built page.
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

const HOME = "/";

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
          : null, // `null` = GitHub chapter, which has no title and therefore no head
    };
  });
}

test.describe("chapter markup (MOTION-01)", () => {
  test("exposes nine chapters, head before body, and the untitled one without a head", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "load" });

    const chapters = page.locator("main > section[data-chapter]");
    await expect(chapters).toHaveCount(9);

    const hooks = await page.evaluate(() =>
      [...document.querySelectorAll("main > section[data-chapter]")].map((section) => ({
        id: section.id,
        heads: section.querySelectorAll("[data-chapter-head]").length,
        bodies: section.querySelectorAll("[data-chapter-body]").length,
      })),
    );

    // Eight titled chapters get one head + one body; `#github` borrows its
    // title from the universe phase, so it only has a body.
    const titled = hooks.filter((chapter) => chapter.heads === 1);
    expect(titled).toHaveLength(8);
    for (const chapter of hooks) {
      expect(chapter.bodies).toBe(1);
      expect(chapter.heads).toBeLessThanOrEqual(1);
    }

    for (const sectionId of [
      "about",
      "systems-in-motion",
      "career",
      "projects",
      "creative-lab",
      "skills",
      "certifications",
      "contact",
    ]) {
      const chapter = await beats(page, sectionId);
      expect(chapter.headBeforeBody, `${sectionId}: head before body`).toBe(true);
    }
    const github = await beats(page, "github");
    expect(github.headBeforeBody).toBe(null);
  });
});

test.describe("chapter animation ranges", () => {
  test("head settles before the body: different, ordered ranges", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });

    const chapter = await beats(page, "about");
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
    // `#about` is the shortest titled chapter: one paragraph plus the metric
    // row. Two viewport heights past its start can only be past its entry
    // range, so a reader who kept scrolling always reaches the settled state.
    await page
      .locator("#about")
      .evaluate((el) => el.scrollIntoView({ behavior: "instant", block: "start" }));
    await page.evaluate(() =>
      window.scrollBy({ top: window.innerHeight * 2, behavior: "instant" }),
    );
    await page.waitForTimeout(300);

    const chapter = await beats(page, "about");
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

    const chapter = await beats(page, "about");
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

    const chapter = await beats(page, "about");
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

    const chapter = await beats(page, "about");
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

    await expect(page.locator("main > section[data-chapter]")).toHaveCount(9);
    const about = page.locator("#about [data-chapter-body]");
    expect(await about.textContent()).toContain("applied machine learning");
    await context.close();
  });
});
