import { expect, test } from "@playwright/test";

test.describe("MOTION-06 data instruments", () => {
  test("the GitHub terminal prints its first line without waiting for motion", async ({
    browser,
  }) => {
    // MOTION-19 moved the GitHub instrumentation from the home to `/data`, where
    // it is not a chapter at all. The line below is server markup, so a reader
    // without JavaScript — and without an entrance beat — still gets it.
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/data");
    const boot = page.locator('#github [data-phase="boot"]');

    await page.locator("#github").evaluate((section) => section.scrollIntoView());
    const startedAt = Date.now();
    await expect(boot).toContainText("> INITIALIZING DEVELOPER PROFILE... OK", { timeout: 1000 });
    expect(Date.now() - startedAt).toBeLessThan(1000);
    await context.close();
  });

  test("GitHub instruments own timing instead of a chapter block reveal", async ({ page }) => {
    await page.goto("/data");
    // The instruments still decide their own timing; what changed is that no
    // chapter body wraps them any more, so there is no block beat to cancel.
    await expect(page.locator("#github [data-phase]")).not.toHaveCount(0);
    await expect(page.locator("#github [data-chapter-body]")).toHaveCount(0);
    await expect(page.locator("#github [data-chapter]")).toHaveCount(0);
  });

  test("reduced motion keeps Observatory metrics final and stable", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/data");
    const cards = page.locator('[data-observatory="metric"]');
    await expect(cards).toHaveCount(6);
    await expect(cards.first()).toContainText(/\d+/);

    const before = await cards.allTextContents();
    expect(before.join(" ")).not.toContain("NaN");
    await page.waitForTimeout(700);
    expect(await cards.allTextContents()).toEqual(before);
  });

  test("Observatory data remains visible with JavaScript disabled", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/data");

    await expect(page.locator('[data-observatory="metric"]')).toHaveCount(6);
    await expect(page.getByText("Projects catalogued")).toBeVisible();
    await expect(page.getByText("GitHub stars")).toBeVisible();
    await context.close();
  });
});
