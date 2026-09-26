import { expect, test } from "@playwright/test";

// `/skills` was the second orphaned page: the nav only pointed at the /#skills
// anchor on home, never at this standalone page. These guard the entry points
// and the label-collision trap documented in src/lib/constants.ts.
test.describe("Skills page discoverability", () => {
  test("home footer links to /skills", async ({ page }) => {
    await page.goto("/");
    const link = page.locator('footer a[href="/skills"]');
    await expect(link).toHaveCount(1);
    await expect(link).toBeVisible();
  });

  test("following the footer link lands on the skills page", async ({ page }) => {
    await page.goto("/");
    await page.locator('footer a[href="/skills"]').click();
    await expect(page).toHaveURL(/\/skills$/);
    await expect(page.getByRole("heading", { name: "Skills", level: 2 })).toBeVisible();
  });

  // The command palette keys pages by `page-${slugify(label)}` and skips
  // duplicates, and NAV_ITEMS already owns the label "Skills" (→ /#skills).
  // A footer label of "Skills" would be silently dropped from the index, so
  // this asserts the label actually survives into the palette.
  test("findable via the command palette under a non-colliding label", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(
      () =>
        (window as unknown as { __COMMAND_PALETTE_READY?: boolean }).__COMMAND_PALETTE_READY ===
        true,
    );
    await page.keyboard.press("Control+k");
    await page.getByRole("searchbox").fill("all skills");
    await expect(page.getByRole("button", { name: /All Skills/ })).toBeVisible();
  });

  test("the nav keeps its home anchor, unchanged", async ({ page }) => {
    await page.goto("/");
    const navLink = page.locator('header nav a[href="/#skills"]');
    await expect(navLink).toHaveCount(1);
  });
});
