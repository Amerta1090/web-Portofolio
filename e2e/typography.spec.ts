import { expect, test } from "@playwright/test";

test.describe("Typography: fluid display scale", () => {
  test("hero headline uses the display scale with grotesque tracking", async ({ page }) => {
    // MOTION-25 retuned these numbers for a grotesque: 0.95 / -0.035em were set
    // for a serif with short ascenders. Archivo's ascenders are taller, so the
    // ratio moved to 1 and the tracking loosened to -0.02em — read from computed
    // style, because a class name cannot prove which value won.
    await page.goto("/");
    const h1 = page.locator("#hero h1");
    await expect(h1).toBeVisible();
    const styles = await h1.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        fontSize: Number.parseFloat(s.fontSize),
        lineHeight: Number.parseFloat(s.lineHeight),
        letterSpacing: Number.parseFloat(s.letterSpacing),
        fontFamily: s.fontFamily,
      };
    });
    expect(styles.fontFamily).toContain("Archivo");
    expect(styles.lineHeight / styles.fontSize).toBeCloseTo(1, 1);
    expect(styles.letterSpacing).toBeLessThan(0);
    expect(styles.fontSize).toBeGreaterThan(36);
  });

  for (const width of [375, 320]) {
    test(`no horizontal overflow at ${width}px on index`, async ({ page }) => {
      await page.setViewportSize({ width, height: 667 });
      await page.goto("/");
      await expect(page.locator("#hero h1")).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test("big numbers resolve the wide Archivo instance, not a class name", async ({ page }) => {
    // M25.5: `.text-numeral` asks for `font-stretch: 125%` and a real 125%-wide
    // instance answers it. Assert the computed value AND the weight the face
    // ships (300) — a `font-weight: 700` override would fall back to the
    // narrow variable file and quietly lose the wide numerals.
    await page.goto("/");
    const numerals = page.locator(".text-numeral");
    const count = await numerals.count();
    expect(count, "the homepage sets at least one big numeral").toBeGreaterThan(0);
    await page.evaluate(() => document.fonts.ready);
    const first = numerals.first();
    await expect(first).toBeVisible();
    const styles = await first.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        weight: s.fontWeight,
        stretch: s.fontStretch,
        variant: s.fontVariantNumeric,
        family: s.fontFamily,
      };
    });
    expect(styles.family).toContain("Archivo");
    expect(styles.weight).toBe("300");
    expect(styles.stretch).toBe("125%");
    expect(styles.variant).toContain("tabular-nums");
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
        fontSize: Number.parseFloat(s.fontSize),
        letterSpacing: Number.parseFloat(s.letterSpacing) || 0,
        transform: s.textTransform,
      };
    });
    expect(styles.fontFamily).toContain("Archivo");
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
        size: Number.parseFloat(getComputedStyle(h).fontSize),
      })),
    );
    const giants = headingSizes.filter((h) => h.size >= 60);
    expect(giants.length).toBeLessThanOrEqual(1);
    const nonHeroH2 = headingSizes.filter((h) => h.tag === "H2");
    for (const h of nonHeroH2) {
      expect(h.size, "h2 must stay below display scale").toBeLessThan(60);
    }
  });
});
