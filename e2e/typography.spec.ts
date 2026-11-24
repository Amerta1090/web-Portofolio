import { test, expect } from "@playwright/test";

test.describe("Typography: fluid display scale", () => {
  test("hero headline uses display scale with tight tracking", async ({ page }) => {
    await page.goto("/");
    const h1 = page.locator("#hero h1");
    await expect(h1).toBeVisible();
    const styles = await h1.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        fontSize: parseFloat(s.fontSize),
        lineHeight: parseFloat(s.lineHeight),
        letterSpacing: parseFloat(s.letterSpacing),
        fontFamily: s.fontFamily,
      };
    });
    expect(styles.fontFamily).toContain("Fraunces");
    expect(styles.lineHeight / styles.fontSize).toBeCloseTo(0.95, 1);
    expect(styles.letterSpacing).toBeLessThan(0);
    expect(styles.fontSize).toBeGreaterThan(36);
  });

  test("no horizontal overflow at 375px on index", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await expect(page.locator("#hero h1")).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("section labels read in the body face at a legible size", async ({ page }) => {
    // MOTION-12 changed this contract. It used to pin "small mono uppercase with
    // wide tracking" — which was a true description of `.section-label` and also
    // the exact device the tells registry bans (a tiny tracked uppercase label).
    // The assertion now pins the reversed decision: the label survives as a
    // group label, set in the reading face at or above the 13px legibility floor,
    // with no uppercase costume and no tracking that a reader has to squint at.
    await page.goto("/");
    const label = page.locator(".section-label").first();
    await expect(label).toBeVisible();
    const styles = await label.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        fontFamily: s.fontFamily,
        fontSize: parseFloat(s.fontSize),
        letterSpacing: parseFloat(s.letterSpacing),
        transform: s.textTransform,
      };
    });
    expect(styles.fontFamily).not.toContain("JetBrains Mono");
    expect(styles.fontSize).toBeGreaterThanOrEqual(13);
    expect(styles.transform).toBe("none");
    expect(styles.letterSpacing / styles.fontSize).toBeLessThan(0.1);
  });

  test("only one giant heading per page; other headings step down gradually", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const headingSizes = await page.evaluate(() =>
      Array.from(document.querySelectorAll("h1, h2")).map((h) => ({
        tag: h.tagName,
        size: parseFloat(getComputedStyle(h).fontSize),
      }))
    );
    const giants = headingSizes.filter((h) => h.size >= 60);
    expect(giants.length).toBeLessThanOrEqual(1);
    const nonHeroH2 = headingSizes.filter((h) => h.tag === "H2");
    for (const h of nonHeroH2) {
      expect(h.size, "h2 must stay below display scale").toBeLessThan(60);
    }
  });
});
