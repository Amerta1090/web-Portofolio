import { test, expect } from "@playwright/test";

test.describe("Work listing page", () => {
  test("loads and displays case study cards", async ({ page }) => {
    await page.goto("/work");
    await expect(page.locator("h1")).toContainText("Work");
    const cards = page.locator('a[href^="/work/"]');
    await expect(cards).toHaveCount(2);
  });

  test("each card shows title, summary, role, and metrics", async ({ page }) => {
    await page.goto("/work");
    const firstCard = page.locator('a[href^="/work/"]').first();
    await expect(firstCard).toBeVisible();
    await expect(firstCard.locator("h2")).not.toBeEmpty();
    await expect(firstCard.locator("p").first()).not.toBeEmpty();
  });

  test("clicking a card navigates to detail page", async ({ page }) => {
    await page.goto("/work");
    const firstCard = page.locator('a[href^="/work/"]').first();
    const href = await firstCard.getAttribute("href");
    await firstCard.click();
    await expect(page).toHaveURL(new RegExp(`^.*${href}$`));
  });
});

test.describe("Work detail page", () => {
  test("shows title, summary, metrics, and stack tags", async ({ page }) => {
    await page.goto("/work/ai-quranic-tafsir");
    await expect(page.locator("h1")).toContainText("AI Quranic Tafsir");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator(".text-brand").first()).toBeVisible();
    await expect(page.locator("text=Python")).toBeVisible();
  });

  test("renders body content sections", async ({ page }) => {
    await page.goto("/work/ai-quranic-tafsir");
    await expect(page.locator(".case-study-content h2:has-text('Problem')")).toBeVisible();
    await expect(page.locator(".case-study-content h2:has-text('Approach')")).toBeVisible();
    await expect(page.locator(".case-study-content h2:has-text('Key Decisions')")).toBeVisible();
    await expect(page.locator(".case-study-content h2:has-text('Outcome')")).toBeVisible();
  });

  test("back link navigates to work listing", async ({ page }) => {
    await page.goto("/work/ai-quranic-tafsir");
    const backLink = page.locator('a[href="/work"]');
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL(/\/work\/?$/);
  });
});
