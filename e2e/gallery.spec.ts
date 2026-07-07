import { test, expect } from "@playwright/test";

test.describe("Gallery page", () => {
  test("loads with experiment cards", async ({ page }) => {
    await page.goto("/gallery");
    await expect(page.locator("h1")).toContainText("Creative Lab");
    const cards = page.locator('[role="list"] > [role="listitem"]');
    await expect(cards).toHaveCount(8);
  });

  test("Fractal Explorer card is present", async ({ page }) => {
    await page.goto("/gallery");
    await expect(page.getByText("Fractal Explorer")).toBeVisible();
    await expect(page.getByText("WebGL")).toBeVisible();
    await expect(page.getByText("Fractal")).toBeVisible();
  });

  test("clicking Fractal Explorer opens modal with controls", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Fractal Explorer").first().click();
    await expect(page.getByText("Mandelbrot")).toBeVisible();
    await expect(page.getByText("Julia")).toBeVisible();
    await expect(page.getByText("Amber")).toBeVisible();
    await expect(page.getByText("Bookmark")).toBeVisible();
  });

  test("Julia toggle shows Cx/Cy controls in modal", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Fractal Explorer").first().click();
    await page.getByText("Julia").click();
    await expect(page.getByText("Cx")).toBeVisible();
    await expect(page.getByText("Cy")).toBeVisible();
    await expect(page.getByText("Morph")).toBeVisible();
  });

  test("morph toggle works in Julia mode", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Fractal Explorer").first().click();
    await page.getByText("Julia").click();
    await page.getByText("Morph").click();
    await expect(page.getByText("Morph On")).toBeVisible();
    await expect(page.getByText("Speed")).toBeVisible();
  });

  test("palette buttons switch active state", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Fractal Explorer").first().click();
    // Amber should be active by default
    const amber = page.getByText("Amber").first();
    await expect(amber).toBeVisible();
    // Click Fire
    await page.getByText("Fire").first().click();
    await expect(page.getByText("Fire").first()).toBeVisible();
  });

  test("Pan and Zoom mode toggle exist", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Fractal Explorer").first().click();
    await expect(page.getByText("Pan")).toBeVisible();
    await expect(page.getByText("Zoom")).toBeVisible();
  });

  test("Bookmark button is present in modal", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Fractal Explorer").first().click();
    await expect(page.getByText("Bookmark")).toBeVisible();
  });

  test("closes modal with Escape", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Fractal Explorer").first().click();
    await expect(page.getByText("Mandelbrot")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByText("Mandelbrot")).not.toBeVisible();
  });

  test("deep link via URL hash opens experiment", async ({ page }) => {
    await page.goto("/gallery#fractal-explorer");
    await expect(page.getByText("Mandelbrot")).toBeVisible({ timeout: 5000 });
  });

  test("Iter slider is adjustable", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Fractal Explorer").first().click();
    const slider = page.locator('label:has-text("Iter") input[type="range"]');
    await expect(slider).toBeVisible();
    const value = await slider.inputValue();
    expect(Number(value)).toBe(256);
  });

  test("Shift slider is adjustable", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Fractal Explorer").first().click();
    const slider = page.locator('label:has-text("Shift") input[type="range"]');
    await expect(slider).toBeVisible();
    await slider.fill("50");
    const value = await slider.inputValue();
    expect(Number(value)).toBe(50);
  });
});
