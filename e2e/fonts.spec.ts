import { test, expect } from "@playwright/test";

test.describe("Typography: self-hosted display font", () => {
  test("no external font CDN requests (googleapis/bunny)", async ({ page }) => {
    const cdnRequests: string[] = [];
    page.on("request", (req) => {
      if (/fonts\.(googleapis|gstatic)\.com|fonts\.bunny\.net/.test(req.url())) {
        cdnRequests.push(req.url());
      }
    });
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    expect(cdnRequests).toEqual([]);
  });

  test("Fraunces woff2 files are served and load successfully", async ({ page }) => {
    const fontResponses: { url: string; status: number }[] = [];
    page.on("response", (res) => {
      if (res.url().includes("/fonts/fraunces-")) {
        fontResponses.push({ url: res.url(), status: res.status() });
      }
    });
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const fraunces = fontResponses.filter((r) => r.url.includes("fraunces"));
    expect(fraunces.length).toBeGreaterThan(0);
    for (const r of fraunces) {
      expect(r.status, `font ${r.url}`).toBe(200);
    }
  });

  test("hero headline computed style uses Fraunces display font", async ({ page }) => {
    await page.goto("/");
    const h1 = page.locator("#hero h1");
    await expect(h1).toBeVisible();
    const fontFamily = await h1.evaluate((el) => getComputedStyle(el).fontFamily);
    expect(fontFamily).toContain("Fraunces");
    await page.evaluate(() => document.fonts.ready);
    const loaded = await page.evaluate(() => document.fonts.check('700 16px "Fraunces"'));
    expect(loaded).toBe(true);
  });

  test("display font preload link is present with correct weight", async ({ page }) => {
    await page.goto("/");
    const preload = page.locator('link[rel="preload"][as="font"]');
    const hrefs = await preload.evaluateAll((links) =>
      links.map((l) => (l as HTMLLinkElement).getAttribute("href"))
    );
    expect(hrefs.some((h) => h?.includes("fraunces-latin-700-normal.woff2"))).toBe(true);
    expect(hrefs.some((h) => h?.includes("inter-400.woff2") || h?.includes("inter-700.woff2"))).toBe(false);
  });

  test("--font-display token is registered on :root", async ({ page }) => {
    await page.goto("/");
    const token = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--font-display").trim()
    );
    expect(token).toContain('"Fraunces"');
    expect(token).toContain("Fraunces Fallback");
  });
});
