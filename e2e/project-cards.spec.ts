import { expect, test } from "@playwright/test";
import { waitForIslandHydration } from "./hydration";

/**
 * Evidence Surface (Task 2.2): the home project card must be a surface that
 * only renders what `data/projects.json` actually holds — real links, honest
 * fallbacks, and nothing that looks like evidence it cannot open. The server
 * HTML must be fully usable on its own (no dead controls), because the card is
 * an island (`client:load`): its markup exists before React has attached.
 *
 * The four slugs below are the deterministic output of the shared slug rule
 * (`title.toLowerCase().replace(/[^a-z0-9]+/g, "-")`), the same one used by
 * `/projects/[slug]` and the observatory index. If the rule changes, both this
 * spec and the unit suite have to move together.
 */
const SLUGS = [
  "retro-game-inspired-portfolio-website",
  "nyatetduwit-offline-first-personal-finance-pwa",
  "ijo-plis-ihsg-usd-idr-forecasting-platform",
  "red-devil-dynamics-ai-goal-timing-predictor-for-manchester-united",
];

const CARDS = "#projects [data-project-card]";

test("home renders exactly the four featured project cards", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(CARDS)).toHaveCount(4);
});

test("each title is a real link to its /projects/<slug> page", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(CARDS)).toHaveCount(4);
  for (const slug of SLUGS) {
    await expect(page.locator(`#projects a[href="/projects/${slug}"]`)).toHaveCount(1);
  }
});

test("external links are real anchors with target and the full rel guard", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(CARDS)).toHaveCount(4);
  // Each of the four featured projects carries two link rows (8 total).
  const external = page.locator('#projects a[target="_blank"]');
  await expect(external).toHaveCount(8);
  const rels = await external.evaluateAll((anchors) => anchors.map((a) => a.getAttribute("rel")));
  expect(rels.every((rel) => rel === "noopener noreferrer")).toBe(true);
});

test("media labels are never rendered (they are not openable evidence)", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(CARDS)).toHaveCount(4);
  // `media` on IJO PLIS holds labels ("IHSG Predictor", "IDR Predictor"), not
  // URLs; the card must not present them as things you can open.
  await expect(page.locator("#projects")).not.toContainText("IHSG Predictor");
  await expect(page.locator("#projects")).not.toContainText("IDR Predictor");
});

// Task 2.3: the card area gained six filter chips, but only *after* hydration.
// A pre-hydration control is a dead control, so the "no controls" contract is
// asserted against the server HTML with JavaScript off; the post-hydration
// contract is the inverse — every button that exists is a live filter chip.
test.describe("server HTML (JavaScript disabled)", () => {
  test.use({ javaScriptEnabled: false });

  test("the card area has no dead controls", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(CARDS)).toHaveCount(4);
    // No chip, no reset — the server ships zero buttons in this section.
    await expect(page.locator("#projects button")).toHaveCount(0);
    // Inline onevent* attributes would be inert-until-hydration controls.
    const withInlineHandlers = await page
      .locator("#projects [onclick], #projects [onmouseover], #projects [onmousemove]")
      .count();
    expect(withInlineHandlers).toBe(0);
  });
});

test("after hydration every card-area button is a live filter chip", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(CARDS)).toHaveCount(4);
  await waitForIslandHydration(page, "[data-project-card]");
  await expect(page.locator("#projects [data-filter-chip]")).toHaveCount(6);
  // Nothing clickable exists outside the fieldset (the reset button only
  // appears inside the empty state, which needs an active non-"all" filter).
  await expect(page.locator("#projects button:not([data-filter-chip])")).toHaveCount(0);
});

test("clicking a card's title navigates to the real project page", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(CARDS)).toHaveCount(4);
  const title = page.locator(`#projects a[href="/projects/retro-game-inspired-portfolio-website"]`);
  await Promise.all([
    page.waitForURL("**/projects/retro-game-inspired-portfolio-website"),
    title.click(),
  ]);
  await expect(page).toHaveURL(/\/projects\/retro-game-inspired-portfolio-website$/);
});

test("cursor spotlight is on when the grid is visible after hydration", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(CARDS)).toHaveCount(4);
  await page.locator("#projects").scrollIntoViewIfNeeded();
  // The grid pauses its spotlight while off-screen (useRafGuard); once it is
  // visible and hydrated the attribute must be present on all four cards.
  await waitForIslandHydration(page, "[data-project-card]");
  await expect(page.locator('#projects [data-tilt-spotlight="on"]')).toHaveCount(4);
  // Post-hydration the six filter chips are real buttons; nothing else in the
  // card area may be clickable (the dead-control contract lives in the
  // JS-disabled test above).
  await expect(page.locator("#projects button:not([data-filter-chip])")).toHaveCount(0);
});
