import { expect, test } from "@playwright/test";

test.describe("RecommendedRow (content-based recommender)", () => {
  test("stays hidden on a fresh session with no interactions", async ({ page }) => {
    await page.goto("/gallery");
    await expect(page.getByRole("heading", { name: "Creative Lab" })).toBeVisible();
    await expect(
      page.locator("section[aria-label='Rekomendasi berdasarkan aktivitas']"),
    ).toHaveCount(0);
  });

  test("appears after launching an experiment, recommending similar work", async ({ page }) => {
    await page.goto("/gallery");
    const grid = page.locator("[aria-label='Experiments']");
    await grid.getByText("Liquid Distortion").first().scrollIntoViewIfNeeded();
    await grid.getByText("Liquid Distortion").first().click();
    await expect(page.locator("[data-modal-content]")).toBeVisible({ timeout: 10000 });
    await page.keyboard.press("Escape");
    await expect(page.locator("[data-modal-content]")).toHaveCount(0);

    const strip = page.locator("section[aria-label='Rekomendasi berdasarkan aktivitas']");
    await expect(strip).toBeVisible();
    await expect(strip).toContainText("Karena kamu jelajahi");
    await expect(strip).toContainText("Liquid Distortion");

    const cards = strip.locator("[data-testid='recommendation-card']");
    await expect(cards).toHaveCount(3);
  });

  test("never recommends the item currently being explored", async ({ page }) => {
    await page.goto("/gallery");
    const grid = page.locator("[aria-label='Experiments']");
    await grid.getByText("Fractal Explorer").first().scrollIntoViewIfNeeded();
    await grid.getByText("Fractal Explorer").first().click();
    await expect(page.locator("[data-modal-content]")).toBeVisible({ timeout: 10000 });
    await page.keyboard.press("Escape");
    await expect(page.locator("[data-modal-content]")).toHaveCount(0);

    const strip = page.locator("section[aria-label='Rekomendasi berdasarkan aktivitas']");
    await expect(strip).toBeVisible();
    await expect(strip.getByRole("button", { name: /fractal-explorer/ })).toHaveCount(0);
  });

  test("recommendations persist across a reload (localStorage history)", async ({
    page,
    context,
  }) => {
    await page.goto("/gallery");
    const grid = page.locator("[aria-label='Experiments']");
    await grid.getByText("Liquid Distortion").first().scrollIntoViewIfNeeded();
    await grid.getByText("Liquid Distortion").first().click();
    await expect(page.locator("[data-modal-content]")).toBeVisible({ timeout: 10000 });
    await page.keyboard.press("Escape");
    await expect(page.locator("[data-modal-content]")).toHaveCount(0);
    await expect(
      page.locator("section[aria-label='Rekomendasi berdasarkan aktivitas']"),
    ).toBeVisible();

    await page.reload();
    const strip = page.locator("section[aria-label='Rekomendasi berdasarkan aktivitas']");
    await expect(strip).toBeVisible();
    await expect(strip.locator("[data-testid='recommendation-card']")).toHaveCount(3);
  });
});
