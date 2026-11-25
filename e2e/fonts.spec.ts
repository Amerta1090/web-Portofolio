import { test, expect } from "@playwright/test";

/**
 * MOTION-25 / D-13 rewrote this contract. It used to pin a self-hosted
 * *display serif* (a second family) plus four Inter faces. The site now ships
 * one family — Archivo — so these tests pin the new facts: every route reads in
 * Archivo, only the wght file is preloaded, and the retired faces are neither
 * requested nor served.
 */
test.describe("Typography: self-hosted Archivo", () => {
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

  test("Archivo woff2 is served, and the retired families are not requested", async ({ page }) => {
    const fontResponses: { url: string; status: number }[] = [];
    page.on("response", (res) => {
      if (res.url().includes("/fonts/")) {
        fontResponses.push({ url: res.url(), status: res.status() });
      }
    });
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    await page.evaluate(() => document.fonts.ready);

    const archivo = fontResponses.filter((r) => r.url.includes("/fonts/archivo-"));
    expect(archivo.length, "the homepage must fetch at least one Archivo face").toBeGreaterThan(0);
    for (const r of archivo) {
      expect(r.status, `font ${r.url}`).toBe(200);
    }

    // The migration is complete only if nothing still asks for the old faces.
    const retired = fontResponses.filter((r) => /fraunces|inter-|jetbrains-mono-latin-500/.test(r.url));
    expect(retired).toEqual([]);
  });

  test("hero headline computed style resolves to Archivo", async ({ page }) => {
    await page.goto("/");
    const h1 = page.locator("#hero h1");
    await expect(h1).toBeVisible();
    const fontFamily = await h1.evaluate((el) => getComputedStyle(el).fontFamily);
    expect(fontFamily).toContain("Archivo");
    await page.evaluate(() => document.fonts.ready);
    const loaded = await page.evaluate(() => document.fonts.check('700 16px "Archivo"'));
    expect(loaded).toBe(true);
  });

  test("exactly one font preload, and it is the variable wght file", async ({ page }) => {
    await page.goto("/");
    const hrefs = await page
      .locator('link[rel="preload"][as="font"]')
      .evaluateAll((links) => links.map((l) => (l as HTMLLinkElement).getAttribute("href")));
    expect(hrefs.length, "preload only the weight the hero sets").toBe(1);
    expect(hrefs[0]).toContain("archivo-latin-wght-normal.woff2");
  });

  test("--font-display is an alias of the one family, not a second face", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState('networkidle');
    const tokens = await page.evaluate(() => {
      const s = getComputedStyle(document.documentElement);
      return {
        display: s.getPropertyValue("--font-display").trim(),
        sans: s.getPropertyValue("--font-sans").trim(),
        mono: s.getPropertyValue("--font-mono").trim(),
      };
    });
    expect(tokens.sans).toContain("Archivo");
    expect(tokens.sans).toContain("Archivo Fallback");
    // The display hook stays (every `.font-display` use reads it) but must not
    // introduce a second family. Chromium substitutes var() in a custom
    // property's computed value, so the proof is equality with the body stack —
    // a second family would show up as a different string here.
    expect(tokens.display).toBe(tokens.sans);
    // No mono webfont ships (D-16): the stack is the platform's monospace.
    expect(tokens.mono).not.toContain("JetBrains");
    expect(tokens.mono).toContain("ui-monospace");
  });
});
