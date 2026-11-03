import { expect, test } from "@playwright/test";
import { waitForIslandHydration } from "./hydration";

/**
 * The hero evidence row (M2.1) — the claim, and where it can be checked.
 *
 * The numbers, and more importantly the *omission* rules, are pinned by
 * `src/lib/hero-metrics.test.ts`; this spec covers the three things a unit test
 * structurally cannot:
 *
 * 1. **The target exists.** Each `href` is a fact about the built site: `/work`
 *    exists, `/about#certifications` and `/about#career` point at ids someone
 *    renders. A link to a route or anchor nobody renders is the same defect as
 *    a button with no handler, and asserting the `href` string would pass either
 *    way (Task 0.5).
 * 2. **The figures agree with the pages they send you to.** The row and the
 *    pages that list the same records read one dataset through different
 *    components, so comparing what each prints is the only way to prove the
 *    hero row is evidence rather than decoration. This is the actual product
 *    contract of M2.1.2, and it cannot be checked in jsdom.
 * 3. **It survives without JavaScript.** The island hydrates on idle, and every
 *    figure is in the server HTML; a row that only appears after hydration would
 *    make the hero's first claim depend on a bundle arriving.
 *
 * Nothing here pins a cached figure. `22`, `62` and `2` are outputs, not
 * contracts — the contracts are the shape of the name, the target of the link,
 * and the agreement between the row and the page it points at.
 */

const ROW = "[data-hero-metric-row]";
const METRIC = "[data-hero-metric]";

/**
 * Where each figure can be checked, mirrored from `HERO_METRIC_HREFS` in
 * `src/lib/hero-metrics.ts`.
 *
 * The module cannot be imported here: it reaches `./facts`, which reaches the
 * JSON data layer, and Bun's ESM loader rejects those imports without an import
 * attribute (the same wall T2.6 hit). So the map is copied with a comment that
 * names its source — and the unit test pins the real one.
 */
const HERO_TARGETS = {
  projects: "/work",
  certifications: "/about#certifications",
  experience: "/about#career",
} as const;

/**
 * `Longest streak: 27 days` → `["Longest streak", "27 days"]`.
 *
 * Split on the first `": "` because a suffix legitimately contains a space and a
 * label could contain a colon in future data. Returns `null` when the name is not
 * in the expected shape, which is itself a failure worth reporting by name.
 */
function splitName(name: string): { label: string; value: string } | null {
  const at = name.indexOf(": ");
  if (at < 1) return null;
  return { label: name.slice(0, at), value: name.slice(at + 2) };
}

test.describe("hero evidence row", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("every figure is a link to a canonical route whose target exists", async ({ page }) => {
    const row = page.locator(ROW);
    await expect(row).toHaveCount(1);

    const links = row.locator(METRIC);
    await expect(links.first()).toBeAttached();

    const pairs = await links.evaluateAll((nodes) =>
      nodes.map((node) => ({
        id: node.getAttribute("data-hero-metric"),
        href: (node as HTMLAnchorElement).getAttribute("href"),
      })),
    );
    // MOTION-19: the work first, then the credentials, then the time it took —
    // and each destination is a page that lists what it counts, not a home
    // anchor that happens to be nearby (the old `#github-metrics` did exactly
    // that and landed ~2,000px above the counters it promised).
    expect(pairs).toEqual(Object.entries(HERO_TARGETS).map(([id, href]) => ({ id, href })));

    // The href is only worth anything if the page answers to it. Fetch the path
    // and read the fragment off the real document; asserting the string alone
    // would pass over a dead anchor (Task 0.5).
    for (const { href } of pairs) {
      if (!href) throw new Error("hero metric without an href");
      const [path, fragment] = href.split("#");
      const response = await page.request.get(path);
      expect(response.status(), `${path} answers`).toBe(200);
      if (!fragment) continue;
      await page.goto(path);
      await expect(page.locator(`#${fragment}`), `${href} names a real section`).toHaveCount(1);
    }
  });

  test("the accessible name is `Kind: value` and carries the visible text", async ({ page }) => {
    const links = page.locator(METRIC);
    await expect(links.first()).toBeAttached();

    const pairs = await links.evaluateAll((nodes) =>
      nodes.map((node) => {
        const el = node as HTMLAnchorElement;
        const label = el.querySelector(".section-label")?.textContent?.trim() ?? "";
        // The value spans nest, so the text has to be read with whitespace
        // collapsed rather than compared raw: the accessible name is built from
        // the builder's fields, and this is what proves it matches the screen.
        const value = (el.firstElementChild?.textContent ?? "").replace(/\s+/g, " ").trim();
        return { name: el.getAttribute("aria-label"), label, value };
      }),
    );

    for (const { name, label, value } of pairs) {
      expect(label.length).toBeGreaterThan(0);
      expect(value.length).toBeGreaterThan(0);
      // Exact shape, not a word budget (Q4.2 #8): the bug being prevented is a
      // name that grows into a paragraph, and a threshold breaks on a long month.
      expect(name).toBe(`${label}: ${value}`);
      // WCAG 2.5.3: the visible label has to survive inside the name.
      expect(name).toContain(label);
    }
  });

  test("is readable with JavaScript disabled", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/");

    const links = page.locator(METRIC);
    await expect(links.first()).toBeAttached();
    expect(await links.count()).toBeGreaterThan(0);

    // Every figure keeps its name and its value with nothing to run.
    const names = await links.evaluateAll((nodes) =>
      nodes.map((n) => ({
        name: n.getAttribute("aria-label"),
        text: (n.textContent ?? "").replace(/\s+/g, " ").trim(),
      })),
    );
    for (const { name, text } of names) {
      const parsed = splitName(name ?? "");
      expect(parsed, `name "${name}" is not \`Kind: value\``).not.toBeNull();
      expect(text).toContain(parsed?.value);
    }

    await context.close();
  });

  test("is static under reduced motion, with no animation wrapper", async ({ page }) => {
    // `test.use({ reducedMotion })` is silently ignored in this Playwright
    // version (Q4.2 #1), so the preference is set on the page and verified
    // through the row's own state hook rather than assumed.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await waitForIslandHydration(page, METRIC);

    expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(
      true,
    );

    const row = page.locator(ROW);
    await expect(row).toHaveAttribute("data-hero-metric-row", "ready");
    // The static branch is a plain `<ul>`: nothing to animate means no inline
    // style from motion at all.
    expect(await row.getAttribute("style")).toBeNull();
    await expect(page.locator(METRIC).first()).toBeVisible();
  });

  test("the figures agree with the pages that list them", async ({ page }) => {
    const names = await page
      .locator(METRIC)
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("aria-label") ?? ""));
    // `Kind: value` → the first token of the value (no figure in this row has a
    // thousands separator today; the builder would keep them if one did).
    const figureFor = (label: string) => {
      const name = names.find((candidate) => candidate.startsWith(`${label}: `));
      return name?.slice(label.length + 2).split(" ")[0];
    };
    const projects = figureFor("Projects");
    const certifications = figureFor("Certifications");
    expect(projects).toBeTruthy();
    expect(certifications).toBeTruthy();

    // Two render sites, two different components, one dataset: this is the
    // actual product contract (M2.1.2), and jsdom cannot check it. `/work`
    // prints `${projects.length} projects across …`; `/about` prints
    // `${certifications.length} professional certifications` as the section
    // subtitle. Experience has no printed counterpart anywhere, so inventing a
    // comparison for it would be worse than leaving it to the link test above.
    await page.goto("/work");
    await expect(
      page.getByText(`${projects} projects across ML, IoT, web, CLI, and DevOps.`, { exact: true }),
    ).toBeVisible();

    await page.goto("/about");
    await expect(
      page.getByText(`${certifications} professional certifications`, { exact: true }),
    ).toBeVisible();
  });

  test("does not overflow the viewport on small screens", async ({ page }) => {
    for (const width of [320, 375, 768]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.locator(METRIC).first()).toBeAttached();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(0);
    }
  });
});

test.describe("Hero headline split (M4.9)", () => {
  test("splits into words with full motion (aria + text intact)", async ({ page }) => {
    await page.goto("/");
    const headline = page.locator(".border-l-4 > p");
    await expect(headline).toBeAttached();
    await expect
      .poll(async () => headline.locator(":scope > div").count(), { timeout: 15_000 })
      .toBeGreaterThan(0);
    const text = ((await headline.textContent()) ?? "").replace(/\s+/g, " ").trim();
    expect(await headline.getAttribute("aria-label")).toBe(text);
    expect(text.length).toBeGreaterThan(0);
  });

  test("headline stays whole with reduced motion (M4.9.2, no SplitText wrappers)", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const reduced = await page.evaluate(
      () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    expect(reduced).toBe(true);
    const headline = page.locator(".border-l-4 > p");
    await expect(headline).toBeAttached();
    expect(await headline.locator(":scope > div").count()).toBe(0);
    expect((await headline.textContent())?.trim().length).toBeGreaterThan(0);
  });
});

test.describe("MOTION-02 hero handoff", () => {
  test("the cue follows the hero's exit and settles before the next chapter", async ({ page }) => {
    await page.goto("/");
    await waitForIslandHydration(page, "#hero [data-hero-handoff]");
    const hero = page.locator("#hero [data-hero-handoff]");
    const cue = hero.locator("[data-hero-scroll-cue]");
    await expect(hero).toBeAttached();
    await expect(cue).toBeAttached();

    const atRest = await cue.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        name: style.animationName,
        timeline: style.animationTimeline,
        range: style.animationRange,
        opacity: Number(style.opacity),
      };
    });
    expect(atRest.name).toBe("hero-cue-exit");
    expect(atRest.timeline).toBe("--hero-handoff");
    expect(atRest.range).toContain("exit");
    expect(atRest.opacity).toBeGreaterThan(0.9);

    await page.evaluate(() => window.scrollTo({ top: 520, behavior: "instant" }));
    await expect
      .poll(async () => Number(await cue.evaluate((el) => getComputedStyle(el).opacity)))
      .toBeLessThan(0.1);
    await expect(page.locator("#projects [data-chapter-head]")).toBeVisible();
  });

  test("server HTML keeps hero copy visible without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/");

    const heroContent = page.locator("#hero [data-hero-content]");
    await expect(heroContent).toBeVisible();
    await expect(heroContent.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(heroContent.locator("[data-hero-metric]").first()).toBeVisible();
    const visibility = await heroContent
      .locator("[data-hero-metric]")
      .first()
      .evaluate((el) => ({
        opacity: getComputedStyle(el).opacity,
        transform: getComputedStyle(el).transform,
      }));
    expect(visibility).toEqual({ opacity: "1", transform: "none" });

    await context.close();
  });

  test("reduced motion keeps the hero static and skips Lenis", async ({ page }) => {
    const lenisRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("@studio-freight/lenis")) lenisRequests.push(request.url());
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await waitForIslandHydration(page, "#hero [data-hero-handoff]");

    expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(
      true,
    );
    await expect(page.locator("#hero [data-hero-content] h1")).toBeVisible();
    const cue = page.locator("#hero [data-hero-scroll-cue]");
    expect(await cue.evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
    expect(lenisRequests).toEqual([]);
  });
});
