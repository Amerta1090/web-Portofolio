import { type Page, expect, test } from "@playwright/test";

/**
 * Sprint 5 (M5.3) — the final responsive sweep. Every surface was rebuilt across
 * Sprints 1–4 (spine grid, project filter, capability map, bento, reactor) and
 * each one was probed at its own breakpoints; this file is the cross-route
 * matrix the plan asks for, plus the two layout contracts that a passing
 * per-feature spec could still leave unstated: the capability map swaps the
 * measured SVG for a stacked list below `md`, and the career spine only pins at
 * `lg` and up.
 */

// Sprint 5 (M5.3.1) — the seven widths the plan names.
const VIEWPORTS = [320, 375, 768, 1024, 1440, 1920, 2560] as const;

// Sprint 5 (M5.3.2) — measured on the document element, with the repo's own
// clamp. Chromium's `scrollWidth` counts the content box while `clientWidth`
// excludes the strip reserved by `scrollbar-gutter: stable` (M4.2.2), so a
// naive subtraction reports a phantom `-10`; `Math.max(0, …)` is the
// formulation Task 5.1 settled on (`career-spine.spec.ts`, `work.spec.ts`).
const horizontalOverflow = (page: Page) =>
  page.evaluate(() =>
    Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
  );

const ROUTES = [
  { path: "/", name: "home" },
  { path: "/gallery", name: "gallery" },
  { path: "/work/ai-quranic-tafsir", name: "case study" },
  { path: "/observatory", name: "observatory" },
] as const;

for (const route of ROUTES) {
  test(`${route.name} holds at 0 horizontal overflow from 320 to 2560`, async ({ page }) => {
    await page.goto(route.path);
    for (const width of VIEWPORTS) {
      // Only geometry is read, live, at each width — no snapshot is carried
      // across the loop, so nothing here depends on wall-clock settling
      // (L3.3 #1/#2: document coordinates for anything compared over time).
      await page.setViewportSize({ width, height: 900 });
      expect(await horizontalOverflow(page), `${route.path} overflows at ${width}px`).toBe(0);
    }
  });
}

test("no route can actually be scrolled sideways at 320 (M5.3.2)", async ({ page }) => {
  // The formula above is the repo's accepted metric, but on its own it cannot
  // distinguish "a real 52px overflow" from "a clipped box that still enlarges
  // `scrollWidth`" — this sweep found exactly that on `/observatory`, where an
  // `sr-only` `<table>` (903px, `display:table` ignores `width:1px`) contributed
  // 563px nobody could see. So the user-facing property is asserted directly:
  // at the narrowest width a horizontal wheel gesture must not move the page.
  //
  // The gesture is native (`page.mouse.wheel`), not `scrollingElement.scrollLeft
  // = n`: the latter was measured staying at 0 even on the broken page, so it
  // would have passed against the defect this test exists to catch.
  await page.setViewportSize({ width: 320, height: 900 });
  for (const route of ROUTES) {
    await page.goto(route.path);
    await page.mouse.move(160, 500);
    await page.mouse.wheel(600, 0);
    expect(await page.evaluate(() => window.scrollX), `${route.path} scrolled sideways`).toBe(0);
  }
});

test("capability map swaps its measured SVG for the stacked list below md (M5.3.3)", async ({
  page,
}) => {
  await page.goto("/");
  const svg = page.locator("[data-signal-loom] svg[aria-hidden='true']").first();
  // The grid owns no hook of its own; resolve it from the section it lays out,
  // so the assertion cannot drift with a wrapper element.
  const columnCount = () =>
    page.evaluate(() => {
      const section = document.querySelector(
        "[data-signal-loom] section[aria-label='Capability nodes']",
      );
      let el: HTMLElement | null = section?.parentElement ?? null;
      while (el && getComputedStyle(el).display !== "grid") el = el.parentElement;
      return el ? getComputedStyle(el).gridTemplateColumns.split(" ").length : 0;
    });

  // Below md: no SVG, single column — the graph would have nothing to join, so
  // the two node lists simply stack in reading order.
  await page.setViewportSize({ width: 375, height: 900 });
  await expect(svg).toBeHidden();
  expect(await columnCount()).toBe(1);

  // From md up: the SVG is the element the island measures edges against, and
  // the grid opens the gutter column between capability and evidence cards.
  await page.setViewportSize({ width: 1024, height: 900 });
  await expect(svg).toBeVisible();
  expect(await columnCount()).toBe(3);
});

test("career spine pins only from lg up, stays a single column below (M5.3.4)", async ({
  page,
}) => {
  const root = page.locator("[data-career-root]");
  const railCell = root.locator(":scope > div").first();

  // Below lg the rail cell is `hidden` outright and the root is not a grid at
  // all: the spine is one static column — nothing is pinned and nothing can be.
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto("/");
  await expect(railCell).toBeHidden();
  expect(await root.evaluate((el) => getComputedStyle(el).display)).toBe("block");

  // At lg the cell appears, the root opens its two tracks, and the wrapper the
  // island lives in is the sticky element. `position` is a claim about the box
  // model, not about a frame.
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(railCell).toBeVisible();
  expect(await root.evaluate((el) => getComputedStyle(el).display)).toBe("grid");
  const rail = railCell.locator(":scope > div").first();
  expect(await rail.evaluate((el) => getComputedStyle(el).position)).toBe("sticky");

  // To prove it *pins*, scroll into the spine first and read the
  // viewport-relative top — the only coordinate that moves when a page scrolls
  // (L3.3 #1). Reading at `scrollTop = 0` measures the rail's natural position
  // ~6000px down the document, where sticky legitimately has nothing to do.
  // `behavior: "instant"` because `global.css` sets `scroll-behavior: smooth`.
  const target = await page
    .locator("#career li[data-career-year='2025']")
    .evaluate((node) => node.getBoundingClientRect().top + window.scrollY + 200);
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), target);

  // `lg:top-24` — the declared header offset (96px). If the pin were relative to
  // the section's own overflow (the `overflow-hidden` bug Task 1.3 fixed, now
  // prevented by `overflow-clip` in `Section.astro`) the rail would have slid
  // away instead of holding this value.
  await expect
    .poll(() => rail.evaluate((el) => Math.round(el.getBoundingClientRect().top)), {
      timeout: 8000,
    })
    .toBe(96);
});
