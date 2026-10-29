import { expect, test } from "@playwright/test";

test.describe("MOTION-06 data instruments", () => {
  test("the GitHub terminal has a meaningful line when its chapter enters", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/");
    const boot = page.locator('#github [data-phase="boot"]');

    await page.locator("#github").evaluate((section) => section.scrollIntoView());
    const startedAt = Date.now();
    await expect(boot).toContainText("> INITIALIZING DEVELOPER PROFILE... OK", { timeout: 1000 });
    expect(Date.now() - startedAt).toBeLessThan(1000);
    await context.close();
  });

  test("GitHub instruments own timing instead of the chapter block reveal", async ({ page }) => {
    await page.goto("/");
    const chapterBody = page.locator("#github [data-chapter-body]");
    await expect(chapterBody).toBeAttached();
    await expect
      .poll(() => chapterBody.evaluate((el) => getComputedStyle(el).animationName))
      .toBe("none");
  });

  test("reduced motion keeps Observatory metrics final and stable", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/observatory");
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
    await page.goto("/observatory");

    await expect(page.locator('[data-observatory="metric"]')).toHaveCount(6);
    await expect(page.getByText("Projects catalogued")).toBeVisible();
    await expect(page.getByText("GitHub stars")).toBeVisible();
    await context.close();
  });
});
