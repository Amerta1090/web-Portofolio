import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { retiredRoutes } from "../src/lib/routes";

/**
 * MOTION-18: every retired URL must still land on the right content.
 *
 * In production the host answers with a 301 from `public/_redirects`; `astro
 * preview` (this suite) serves the static fallback page from
 * `src/pages/[...retired].astro` instead, which is the harder path: it has to
 * keep the reader's own `#fragment` (a meta refresh alone drops it). The route
 * table is imported, not copied, and the projects are read from the data file
 * (Bun ESM rejects a JSON import without an attribute — see contact.spec.ts).
 */
const { projects } = JSON.parse(readFileSync("data/projects.json", "utf8")) as {
  projects: { title: string; case_study?: string }[];
};
const routes = retiredRoutes(projects);

const landing = (url: string) => {
  const parsed = new URL(url);
  return `${parsed.pathname.replace(/\/$/, "") || "/"}${parsed.hash}`;
};

test.describe("retired routes redirect (MOTION-18)", () => {
  test("the route table covers the static pages and every old project page", () => {
    // Positive control: without it an empty table would make the loop vacuous.
    expect(routes.length).toBe(8 + projects.length);
  });

  for (const route of routes) {
    test(`${route.from} → ${route.to}`, async ({ page }) => {
      await page.goto(route.from);
      await expect.poll(() => landing(page.url()), { timeout: 15_000 }).toBe(route.to);
    });
  }

  test("a deep link keeps its fragment: /gallery#ulam-spiral → /lab#ulam-spiral", async ({
    page,
  }) => {
    await page.goto("/gallery#ulam-spiral");
    await expect.poll(() => landing(page.url()), { timeout: 15_000 }).toBe("/lab#ulam-spiral");
  });

  test("the reader's fragment wins over the target's: /timeline#career-x", async ({ page }) => {
    await page.goto("/timeline#career-exp-ferswit");
    await expect
      .poll(() => landing(page.url()), { timeout: 15_000 })
      .toBe("/about#career-exp-ferswit");
  });

  test("a query string survives: /projects?category=ml → /work?category=ml", async ({ page }) => {
    await page.goto("/projects?category=ml");
    await expect.poll(() => new URL(page.url()).search, { timeout: 15_000 }).toBe("?category=ml");
    expect(new URL(page.url()).pathname.replace(/\/$/, "")).toBe("/work");
  });

  test("the fallback page is noindex with a canonical to the new URL", async ({ request }) => {
    const html = await (await request.get("/observatory/")).text();
    expect(html).toContain('<meta name="robots" content="noindex"');
    expect(html).toContain(
      'rel="canonical" href="https://portfolio.abdulmajidr708.workers.dev/data"',
    );
  });
});

test.describe("retired routes without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the meta refresh still lands on the canonical page", async ({ page }) => {
    await page.goto("/skills");
    await expect
      .poll(() => new URL(page.url()).pathname.replace(/\/$/, ""), { timeout: 15_000 })
      .toBe("/about");
  });
});

test.describe("sitemap lists only canonical routes", () => {
  test("no retired path appears in the sitemap", async ({ request }) => {
    const xml = await (await request.get("/sitemap-0.xml")).text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
      new URL(m[1]).pathname.replace(/\/$/, ""),
    );
    expect(locs.length).toBeGreaterThan(0);
    const retired = new Set(routes.map((route) => route.from));
    expect(locs.filter((path) => retired.has(path))).toEqual([]);
    for (const path of ["/work", "/about", "/lab", "/data"]) expect(locs).toContain(path);
  });
});
