import { type Page, expect, test } from "@playwright/test";

// MOTION-08 — cross-page continuity under Astro's ClientRouter.
// Each test pins one defect measured before the sprint (`.opencode/probe-m08*.mjs`).

interface VtSample {
  pe: string;
  name: string;
  duration: number;
  delay: number;
}

/** Record every view-transition pseudo-element animation that runs in the page. */
async function sampleViewTransitions(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as unknown as { __vt: VtSample[] };
    w.__vt = [];
    const tick = () => {
      for (const a of document.getAnimations()) {
        const effect = a.effect as KeyframeEffect | null;
        const pe = effect?.pseudoElement ?? "";
        if (!pe.startsWith("::view-transition")) continue;
        const name = (a as CSSAnimation).animationName;
        if (w.__vt.some((x) => x.pe === pe && x.name === name)) continue;
        const t = effect?.getTiming();
        w.__vt.push({ pe, name, duration: Number(t?.duration), delay: Number(t?.delay) });
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

const vt = (page: Page) => page.evaluate(() => (window as unknown as { __vt: VtSample[] }).__vt);

const primaryNav = 'header nav[aria-label="Primary"] ul';

test.describe("Cross-page continuity (MOTION-08)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the persisted header moves aria-current to the page it navigated to", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    // MOTION-18: Home is the logo, not a nav item, so nothing in the nav is
    // current on "/" — the five items are all other pages.
    await expect(page.locator(`${primaryNav} a[aria-current="page"]`)).toHaveCount(0);

    await page.click(`${primaryNav} a[href="/data"]`);
    await page.waitForURL("**/data**");

    // Client navigation keeps the header node (transition:persist) …
    const current = page.locator(`${primaryNav} a[aria-current="page"]`);
    await expect(current).toHaveCount(1);
    await expect(current).toHaveAttribute("href", "/data");
    // … and the server render agrees, trailing slash or not.
    const html = await (await page.request.get("/data/")).text();
    expect(html).toMatch(/href="\/data"[^>]*aria-current="page"/);
  });

  test("back restores the reading position instantly and refocuses the activated link", async ({
    page,
  }) => {
    // "Instantly" is a shape, not a stopwatch: the documented defect was the
    // user seeing the page fly through every chapter while the browser
    // animated the restore. A stopwatch cannot tell that apart from a slow
    // machine, so record scrollY on every frame instead and demand a jump.
    await page.addInitScript(() => {
      const w = window as unknown as { __scrollTrace: number[] };
      w.__scrollTrace = [];
      const tick = () => {
        w.__scrollTrace.push(Math.round(window.scrollY));
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.goto("/", { waitUntil: "load" });
    // MOTION-19 cut the home to 6 chapters, so the three flagship cards that
    // used to sit below y=2,000 are now at y≈1,320 and can no longer carry the
    // reading position this test needs. This is the lab teaser's link, the
    // deepest static anchor on the page (y≈6,497 at 1440×900); the Capability
    // Map evidence nodes are deeper still but hydrate on `client:visible`, so
    // focusing one races the island swapping its markup.
    const link = page.locator('main #creative-lab a[href="/lab"]').first();
    await link.scrollIntoViewIfNeeded();
    await expect.poll(() => link.evaluate((a) => a.getBoundingClientRect().top)).toBeGreaterThan(0);
    const before = await page.evaluate(() => Math.round(scrollY));
    // Derived, not typed: the position has to be deep enough that a smooth
    // fly-through would still be in flight, and the page height is the only
    // honest yardstick for "deep". Measured 2026-11-18: the home is 8,511 px
    // tall at 1440×900 (a quarter = 2,128) and this link lands at 6,028.
    const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(before).toBeGreaterThan(pageHeight / 4);
    const href = (await link.getAttribute("href")) as string;

    await link.focus();
    await page.keyboard.press("Enter");
    await page.waitForURL(`**${href}`);
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);

    await page.goBack();
    await page.waitForURL((url) => url.pathname === "/");
    // The router restores the entry once the swapped document has laid out;
    // written as a generous ceiling so a loaded 4-core box is not the verdict.
    await expect
      .poll(() => page.evaluate(() => Math.round(scrollY)), { timeout: 10_000 })
      .toBe(before);
    const trace = await page.evaluate(
      () => (window as unknown as { __scrollTrace: number[] }).__scrollTrace,
    );
    const inFlight = trace.filter((y) => y > 20 && y < before - 20);
    expect(inFlight).toEqual([]);
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.getAttribute("href") ?? null))
      .toBe(href);
  });

  test("only <main> turns; the chrome does not cross-fade", async ({ page }) => {
    await sampleViewTransitions(page);
    await page.goto("/", { waitUntil: "load" });
    expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(
      false,
    );
    await page.click(`${primaryNav} a[href="/data"]`);
    await page.waitForURL("**/data**");
    // Leaving the home page takes 4.3–6.2 s to swap on this 4-core box (A/B,
    // identical at HEAD with /observatory, MOTION-18), so the 5 s default
    // budget can end before the turn starts.
    await expect
      .poll(async () => (await vt(page)).map((s) => s.name).sort(), { timeout: 15_000 })
      .toEqual(expect.arrayContaining(["page-turn-in", "page-turn-out"]));
    const samples = await vt(page);
    // The root snapshot (header, footer, background) swaps without animating.
    expect(samples.filter((s) => /::view-transition-(old|new)\(root\)/.test(s.pe))).toEqual([]);
    // Content is never held behind the animation for long.
    for (const s of samples.filter((x) => x.name.startsWith("page-turn"))) {
      expect(s.delay + s.duration).toBeLessThanOrEqual(240);
    }

    await page.evaluate(() => {
      (window as unknown as { __vt: VtSample[] }).__vt = [];
    });
    await page.goBack();
    await page.waitForURL((url) => url.pathname === "/");
    await expect
      .poll(async () => (await vt(page)).map((s) => s.name))
      .toEqual(expect.arrayContaining(["page-turn-in-back", "page-turn-out-back"]));
  });

  test("reduced motion navigates with no view-transition animation at all", async ({ page }) => {
    await sampleViewTransitions(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/", { waitUntil: "load" });
    expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(
      true,
    );
    await page.click(`${primaryNav} a[href="/data"]`);
    await page.waitForURL("**/data**");
    await expect(page.locator("main h1")).toBeVisible();
    await page.waitForTimeout(400);
    expect(await vt(page)).toEqual([]);
  });

  test("the new page's heading is visible once the turn settles (no invisible content)", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "load" });
    await page.click(`${primaryNav} a[href="/data"]`);
    await page.waitForURL("**/data**");
    // The URL changes before ClientRouter swaps the DOM in, so wait for the new
    // document itself — otherwise `main h1` can still be the home page's.
    await expect(page).toHaveTitle(/^Data/, { timeout: 15_000 });
    const h1 = page.locator("main h1").first();
    await expect(h1).toBeVisible();
    await expect
      .poll(() => h1.evaluate((el) => getComputedStyle(el).opacity), {
        timeout: 1000,
      })
      .toBe("1");
  });

  test("no third-party smooth-scroll script is fetched or throws", async ({ page }) => {
    const lenis: string[] = [];
    const errors: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("lenis")) lenis.push(r.url());
    });
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto("/", { waitUntil: "load" });
    await page.click(`${primaryNav} a[href="/data"]`);
    await page.waitForURL("**/data**");
    await page.waitForTimeout(500);
    expect(lenis).toEqual([]);
    expect(errors.filter((e) => /Lenis/.test(e))).toEqual([]);
  });
});
