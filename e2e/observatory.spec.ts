import { test, expect } from "@playwright/test";

test.describe("Observatory — portfolio viewed as a dataset", () => {
  test("nav includes Observatory and it navigates to /observatory", async ({ page }) => {
    await page.goto("/");
    const link = page.getByRole("link", { name: "Observatory", exact: true });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/observatory$/);
    await expect(page.getByText("read as a dataset", { exact: false }).first()).toBeVisible();
  });

  test("page renders all analytical sections", async ({ page }) => {
    await page.goto("/observatory");
    for (const label of ["Overview", "Timeline", "Technology", "Patterns", "Insights"]) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
    }
  });

  test("timeline renders SVG nodes and technology bars render", async ({ page }) => {
    await page.goto("/observatory");
    const section = page.getByText("Timeline", { exact: true }).first();
    await section.scrollIntoViewIfNeeded();
    await expect(page.locator("svg").first()).toBeVisible();

    const tech = page.getByText("Technology", { exact: true }).first();
    await tech.scrollIntoViewIfNeeded();
    const bars = page.locator("[data-observatory='bar']");
    expect(await bars.count()).toBeGreaterThan(0);
  });

  test("insights cards each expose their derivation rule", async ({ page }) => {
    await page.goto("/observatory");
    const insights = page.getByText("Insights", { exact: true }).first();
    await insights.scrollIntoViewIfNeeded();
    const footnotes = page.locator("[data-observatory='rule']");
    expect(await footnotes.count()).toBeGreaterThan(0);
  });

  test("dataset metrics are deterministic across reloads", async ({ page }) => {
    await page.goto("/observatory");
    const first = await page.locator("[data-observatory='metric']").allInnerTexts();
    await page.reload();
    await expect(page.locator("[data-observatory='metric']").first()).toBeVisible();
    const second = await page.locator("[data-observatory='metric']").allInnerTexts();
    expect(second).toEqual(first);
  });
});
