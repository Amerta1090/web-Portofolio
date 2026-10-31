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
    await expect(page.locator(`${primaryNav} a[aria-current="page"]`)).toHaveAttribute("href", "/");

    await page.click(`${primaryNav} a[href="/observatory"]`);
    await page.waitForURL("**/observatory**");

    // Client navigation keeps the header node (transition:persist) …
    const current = page.locator(`${primaryNav} a[aria-current="page"]`);
    await expect(current).toHaveCount(1);
    await expect(current).toHaveAttribute("href", "/observatory");
    // … and the server render agrees, trailing slash or not.
    const html = await (await page.request.get("/observatory/")).text();
    expect(html).toMatch(/href="\/observatory"[^>]*aria-current="page"/);
  });

  test("back restores the reading position instantly and refocuses the activated link", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "load" });
    const link = page.locator('#projects a[href^="/projects/"]').first();
    await link.scrollIntoViewIfNeeded();
    await expect.poll(() => link.evaluate((a) => a.getBoundingClientRect().top)).toBeGreaterThan(0);
    const before = await page.evaluate(() => Math.round(scrollY));
    expect(before).toBeGreaterThan(2000);
    const href = (await link.getAttribute("href")) as string;

    await link.focus();
    await page.keyboard.press("Enter");
    await page.waitForURL(`**${href}`);
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);

    const backAt = Date.now();
    await page.goBack();
    await page.waitForURL((url) => url.pathname === "/");
    // Instant: the old smooth fly-through was still short of the target after 2 s.
    await expect
      .poll(() => page.evaluate(() => Math.round(scrollY)), { timeout: 3000 })
      .toBe(before);
    expect(Date.now() - backAt).toBeLessThan(3000);
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
    await page.click(`${primaryNav} a[href="/observatory"]`);
    await page.waitForURL("**/observatory**");
    await expect
      .poll(async () => (await vt(page)).map((s) => s.name).sort())
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
    await page.click(`${primaryNav} a[href="/observatory"]`);
    await page.waitForURL("**/observatory**");
    await expect(page.locator("main h1")).toBeVisible();
    await page.waitForTimeout(400);
    expect(await vt(page)).toEqual([]);
  });

  test("the new page's heading is visible once the turn settles (no invisible content)", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "load" });
    await page.click(`${primaryNav} a[href="/observatory"]`);
    await page.waitForURL("**/observatory**");
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
    await page.click(`${primaryNav} a[href="/observatory"]`);
    await page.waitForURL("**/observatory**");
    await page.waitForTimeout(500);
    expect(lenis).toEqual([]);
    expect(errors.filter((e) => /Lenis/.test(e))).toEqual([]);
  });
});
