import { test, expect } from "@playwright/test";

test.describe("Game Theory experiments", () => {
  test.describe("Gradient Descent Landscape", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/gallery#gradient-descent");
      await page.waitForSelector("[data-modal-content]", { timeout: 5000 });
    });

    test.afterEach(async ({ page }) => {
      await page.keyboard.press("Escape");
    });

    test("deep link opens modal with optimizer buttons", async ({ page }) => {
      await expect(page.getByRole("button", { name: "SGD" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Momentum" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Adam" })).toBeVisible();
    });

    test("shows Reset and Chaos buttons", async ({ page }) => {
      await expect(page.getByRole("button", { name: "Reset" })).toBeVisible();
      await expect(page.getByRole("button", { name: /Chaos/ })).toBeVisible();
    });

    test("shows learning rate slider", async ({ page }) => {
      await expect(page.locator('input[type="range"]')).toBeVisible();
    });

    test("switches optimizer on click", async ({ page }) => {
      await page.getByRole("button", { name: "Adam" }).click();
      await expect(page.getByRole("button", { name: "Adam" })).toBeVisible();
      await page.getByRole("button", { name: "Momentum" }).click();
      await expect(page.getByRole("button", { name: "Momentum" })).toBeVisible();
    });

    test("card is present in gallery", async ({ page }) => {
      await page.keyboard.press("Escape");
      await page.goto("/gallery");
      const card = page.locator('[role="listitem"]').filter({ hasText: "Gradient Descent" });
      await expect(card).toBeVisible();
    });
  });

  test.describe("Prisoner's Dilemma Tournament", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/gallery#prisoners-dilemma");
      await page.waitForSelector("[data-modal-content]", { timeout: 5000 });
    });

    test.afterEach(async ({ page }) => {
      await page.keyboard.press("Escape");
    });

    test("deep link opens modal with Run/Pause, Reset, Step buttons", async ({ page }) => {
      await expect(page.getByRole("button", { name: /Run|Pause/ })).toBeVisible();
      await expect(page.getByRole("button", { name: "Reset" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Step" })).toBeVisible();
    });

    test("shows strategy visibility toggles", async ({ page }) => {
      const modal = page.locator("[data-modal-content]");
      await expect(modal.locator("button").filter({ hasText: /Tit-fo|Grim|Always|Random|Pavlov/i }).first()).toBeVisible();
    });

    test("has speed slider", async ({ page }) => {
      const modal = page.locator("[data-modal-content]");
      await expect(modal.locator('label:has-text("Speed") input[type="range"]')).toBeVisible();
    });

    test("Step button is clickable", async ({ page }) => {
      await page.getByRole("button", { name: "Step" }).click();
      await expect(page.getByRole("button", { name: "Step" })).toBeVisible();
    });

    test("card is present in gallery", async ({ page }) => {
      await page.keyboard.press("Escape");
      await page.goto("/gallery");
      const card = page.locator('[role="listitem"]').filter({ hasText: /Prisoner/ });
      await expect(card).toBeVisible();
    });
  });

  test.describe("Simulated Annealing TSP", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/gallery#simulated-annealing-tsp");
      await page.waitForSelector("[data-modal-content]", { timeout: 5000 });
    });

    test.afterEach(async ({ page }) => {
      await page.keyboard.press("Escape");
    });

    test("deep link opens modal with Run/Pause, Step, Reset buttons", async ({ page }) => {
      await expect(page.getByRole("button", { name: /Run|Pause/ })).toBeVisible();
      await expect(page.getByRole("button", { name: "Step" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Reset" })).toBeVisible();
    });

    test("shows preset buttons", async ({ page }) => {
      await expect(page.getByRole("button", { name: "10 Cities" })).toBeVisible();
      await expect(page.getByRole("button", { name: "20 Cities" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Grid" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Circle" })).toBeVisible();
    });

    test("has temperature and cooling sliders", async ({ page }) => {
      const modal = page.locator("[data-modal-content]");
      await expect(modal.locator('label:has-text("T₀") input[type="range"]')).toBeVisible();
      await expect(modal.locator('label:has-text("Cooling") input[type="range"]')).toBeVisible();
    });

    test("preset switches city count on click", async ({ page }) => {
      await page.getByRole("button", { name: "20 Cities" }).click();
      await expect(page.getByRole("button", { name: "20 Cities" })).toBeVisible();
    });

    test("card is present in gallery", async ({ page }) => {
      await page.keyboard.press("Escape");
      await page.goto("/gallery");
      const card = page.locator('[role="listitem"]').filter({ hasText: /Simulated Annealing/ });
      await expect(card).toBeVisible();
    });
  });
});
