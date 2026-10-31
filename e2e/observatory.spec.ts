import { test, expect } from "@playwright/test";

test.describe("Observatory — portfolio viewed as a dataset", () => {
  // MOTION-18: the Observatory is `/data` (with the GitHub telemetry below it).
  test("nav includes Data and it navigates to /data", async ({ page }) => {
    await page.goto("/");
    const link = page.getByRole("link", { name: "Data", exact: true }).first();
    await expect(link).toBeVisible();
    await link.click();
    // ClientRouter updates the URL at swap time, and leaving the home page takes
    // 4.3–6.2 s to swap on this box (identical at HEAD, MOTION-18 A/B) — so the
    // repo's 15 s cold-navigation budget, not the 5 s default.
    await expect(page).toHaveURL(/\/data$/, { timeout: 15_000 });
    await expect(page.getByText("read as a dataset", { exact: false }).first()).toBeVisible();
  });

  test("page renders all analytical sections", async ({ page }) => {
    await page.goto("/data");
    for (const label of ["Overview", "Timeline", "Technology", "Patterns", "Derived insights"]) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
    }
  });

  test("timeline renders SVG nodes and technology bars render", async ({ page }) => {
    await page.goto("/data");
    const section = page.getByText("Timeline", { exact: true }).first();
    await section.scrollIntoViewIfNeeded();
    await expect(page.locator("svg").first()).toBeVisible();

    const tech = page.getByText("Technology", { exact: true }).first();
    await tech.scrollIntoViewIfNeeded();
    const bars = page.locator("[data-observatory='bar']");
    expect(await bars.count()).toBeGreaterThan(0);
  });

  test("insights cards each expose their derivation rule", async ({ page }) => {
    await page.goto("/data");
    const insights = page.getByText("Derived insights", { exact: true }).first();
    await insights.scrollIntoViewIfNeeded();
    const footnotes = page.locator("[data-observatory='rule']");
    expect(await footnotes.count()).toBeGreaterThan(0);
  });

  test("dataset metrics are deterministic across reloads", async ({ page }) => {
    await page.goto("/data");
    const first = await page.locator("[data-observatory='metric']").allInnerTexts();
    await page.reload();
    await expect(page.locator("[data-observatory='metric']").first()).toBeVisible();
    const second = await page.locator("[data-observatory='metric']").allInnerTexts();
    expect(second).toEqual(first);
  });
});
