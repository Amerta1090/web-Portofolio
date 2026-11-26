import { expect, test } from "@playwright/test";

/**
 * MOTION-26 (M26.2 + M26.3): Full-bleed portrait hero + sticky 34/66 flagship
 * stage with static exhibits.
 */
const SLUGS = [
  "ai-quranic-tafsir",
  "red-devil-dynamics",
  "ijo-plis-ihsg-usd-idr-forecasting-platform",
];

test.describe("MOTION-26 — hero + flagship stage", () => {
  test("hero meets target constraints at 1440 and 375", async ({ page }) => {
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 375, height: 812 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/", { waitUntil: "load" });

      const metrics = await page.evaluate(() => {
        const h1 = document.querySelector("#hero h1");
        const cta = document.querySelector("#hero .hero-cta");
        return {
          h1FontSize: h1 ? Number.parseFloat(getComputedStyle(h1).fontSize) : 0,
          ctaWhiteSpace: cta ? getComputedStyle(cta).whiteSpace : "",
          ctaHref: cta?.getAttribute("href") ?? "",
          overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      });

      expect(metrics.h1FontSize).toBeGreaterThan(32);
      expect(metrics.h1FontSize).toBeLessThanOrEqual(83.2 + 0.5);
      expect(metrics.ctaWhiteSpace).toBe("nowrap");
      expect(metrics.ctaHref).toBe("#projects");
      expect(metrics.overflowX).toBeLessThanOrEqual(0);
    }
  });

  test("renders three flagship systems with real links and sticky stage controls", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "load" });

    await expect(page.locator("#projects [data-flagship-row]")).toHaveCount(3);
    await expect(page.locator("#projects [data-flagship-reading]")).toHaveCount(3);
    await expect(page.locator("#projects [data-flagship-exhibit]")).toHaveCount(3);

    for (const slug of SLUGS) {
      await expect(page.locator(`#projects .flagship-stage a[href="/work/${slug}"]`)).toHaveCount(
        1,
      );
    }

    const external = page.locator('#projects .flagship-stage a[target="_blank"]');
    await expect(external).toHaveCount(3);
    const rels = await external.evaluateAll((anchors) => anchors.map((a) => a.getAttribute("rel")));
    expect(rels.every((rel) => rel === "noopener noreferrer")).toBe(true);

    // Clicking row 1 switches active reading and exhibit.
    await page.locator('#projects [data-flagship-trigger="1"]').click();
    await expect(page.locator('#projects [data-flagship-row="1"]')).toHaveClass(/is-on/);
    await expect(page.locator('#projects [data-flagship-reading="1"]')).toHaveClass(/is-on/);
    await expect(page.locator('#projects [data-flagship-exhibit="1"]')).toHaveClass(/is-on/);
  });

  test("has zero horizontal overflow at all 7 matrix widths", async ({ page }) => {
    for (const width of [320, 375, 768, 1024, 1440, 1920, 2560]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/", { waitUntil: "load" });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `overflow at ${width}px`).toBeLessThanOrEqual(0);
    }
  });

  test("reduced motion disables hero and flagship transitions", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/", { waitUntil: "load" });
    expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(
      true,
    );

    const state = await page.evaluate(() => {
      const photo = document.querySelector("#hero .hero-photo");
      const lede = document.querySelector("#hero .hero-lede");
      const exhibit = document.querySelector("#projects .flagship-exhibit");
      return {
        photoAnim: photo ? getComputedStyle(photo).animationName : "",
        ledeOpacity: lede ? getComputedStyle(lede).opacity : "",
        exhibitTransition: exhibit ? getComputedStyle(exhibit).transitionDuration : "",
      };
    });

    expect(state.photoAnim).toBe("none");
    expect(state.ledeOpacity).toBe("1");
    expect(state.exhibitTransition).toBe("0s");
  });
});

test.describe("server HTML (JavaScript disabled)", () => {
  test.use({ javaScriptEnabled: false });

  test("all three flagship systems are readable in stack order without JS", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });

    await expect(page.locator("#projects [data-flagship-card]")).toHaveCount(3);
    await expect(page.locator("#projects [data-flagship-card]").first()).toBeVisible();
    for (const slug of SLUGS) {
      await expect(page.locator(`#projects .flagship-stack a[href="/work/${slug}"]`)).toHaveCount(
        1,
      );
    }
    await expect(page.locator("#projects button")).toHaveCount(0);
  });
});
