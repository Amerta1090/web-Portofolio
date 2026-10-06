import { expect, test } from "@playwright/test";

/**
 * M1.6.1 — the About numbers link to their evidence (I6/O3: every homepage
 * claim traces to the section that proves it). "Projects Shipped" jumps to
 * the Career Spine, "Certifications" to the certifications section; figures
 * with no single section (years, languages) stay plain cards.
 */
test.describe("about metrics link to their evidence", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // `ImpactMetrics` is `client:idle` — the cards exist after hydration.
    await page.locator("#about a[href='#career']").first().waitFor({ state: "attached" });
  });

  test("projects shipped links to the career spine", async ({ page }) => {
    const link = page.locator("#about a[href='#career']");
    await expect(link).toHaveCount(1);
    expect(await link.innerText()).toMatch(/projects shipped/i);
  });

  test("certifications links to the certifications section", async ({ page }) => {
    const link = page.locator("#about a[href='#certifications']");
    await expect(link).toHaveCount(1);
    expect(await link.innerText()).toMatch(/certifications/i);
  });

  test("figures without a section stay plain cards, not dead links", async ({ page }) => {
    for (const label of ["Years Experience", "Languages"]) {
      const card = page.locator("#about").getByText(label, { exact: true });
      await expect(card).toBeVisible();
      // Visible text, but not wrapped in a link going nowhere.
      expect(await page.locator("#about a").getByText(label, { exact: true }).count()).toBe(0);
    }
  });

  test("clicking projects shipped lands on the spine", async ({ page }) => {
    await page.locator("#about a[href='#career']").click();
    await expect(page).toHaveURL(/#career$/);
    await expect(page.locator("#career")).toBeInViewport();
  });
});
