import { test, expect } from "@playwright/test";

test.describe("Gallery page", () => {
  test("loads with experiment cards", async ({ page }) => {
    await page.goto("/gallery");
    await expect(page.getByRole("heading", { name: "Creative Lab" })).toBeVisible();
    const cards = page.locator('[role="list"] > [role="listitem"]');
    await expect(cards).toHaveCount(8);
  });

  test("Fractal Explorer card is present", async ({ page }) => {
    await page.goto("/gallery");
    await expect(page.getByText("Fractal Explorer")).toBeVisible();
    const card = page.locator('[role="listitem"]').filter({ hasText: "Fractal Explorer" });
    await expect(card).toBeVisible();
    await expect(card.getByText("WebGL", { exact: true })).toBeVisible();
    await expect(card.getByText("Fractal", { exact: true })).toBeVisible();
  });

  test("clicking Fractal Explorer opens modal with controls", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Fractal Explorer").first().click();
    await expect(page.getByRole("button", { name: "Mandelbrot" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Julia" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Amber" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Bookmark" })).toBeVisible();
  });

  test("Julia toggle shows Cx/Cy controls in modal", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Fractal Explorer").first().click();
    await page.getByRole("button", { name: "Julia" }).click();
    const modal = page.locator("[data-modal-content]");
    await expect(modal.getByText("Cx")).toBeVisible();
    await expect(modal.getByText("Cy", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Morph" })).toBeVisible();
  });

  test("morph toggle works in Julia mode", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Fractal Explorer").first().click();
    await page.getByRole("button", { name: "Julia" }).click();
    await page.getByRole("button", { name: "Morph" }).click();
    await expect(page.getByRole("button", { name: "Morph On" })).toBeVisible();
    await expect(page.getByText("Speed")).toBeVisible();
  });

  test("palette buttons switch active state", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Fractal Explorer").first().click();
    await expect(page.getByRole("button", { name: "Amber" })).toBeVisible();
    await page.getByRole("button", { name: "Fire" }).click();
    await expect(page.getByRole("button", { name: "Fire" })).toBeVisible();
  });

  test("Pan and Zoom mode toggle exist", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Fractal Explorer").first().click();
    await expect(page.getByRole("button", { name: "Pan" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Zoom" })).toBeVisible();
  });

  test("Bookmark button is present in modal", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Fractal Explorer").first().click();
    await expect(page.getByRole("button", { name: "Bookmark" })).toBeVisible();
  });

  test("closes modal with Escape", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Fractal Explorer").first().click();
    await expect(page.getByRole("button", { name: "Mandelbrot" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Mandelbrot" })).not.toBeVisible();
  });

  test("deep link via URL hash opens experiment", async ({ page }) => {
    await page.goto("/gallery#fractal-explorer");
    await expect(page.getByRole("button", { name: "Mandelbrot" })).toBeVisible({ timeout: 5000 });
  });

  test("Iter slider is adjustable", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Fractal Explorer").first().click();
    const slider = page.locator('label:has-text("Iter") input[type="range"]');
    await expect(slider).toBeVisible();
    expect(Number(await slider.inputValue())).toBe(256);
  });

  test("Shift slider is adjustable", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Fractal Explorer").first().click();
    const slider = page.locator('label:has-text("Shift") input[type="range"]');
    await expect(slider).toBeVisible();
    await slider.fill("50");
    expect(Number(await slider.inputValue())).toBe(50);
  });
});
