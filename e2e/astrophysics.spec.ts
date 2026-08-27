import { test, expect } from "@playwright/test";

test.describe("Astrophysics experiments", () => {
  test.describe("3-Body Problem", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/gallery#three-body-problem");
      await page.waitForSelector("[data-modal-content]", { timeout: 8000 });
    });

    test.afterEach(async ({ page }) => {
      await page.keyboard.press("Escape");
    });

    test("deep link opens modal with preset selector", async ({ page }) => {
      const select = page.locator("[data-modal-content] select");
      await expect(select).toBeVisible();
      await expect(select).toHaveValue("figure8");
      const optionTexts = await select.locator("option").allTextContents();
      expect(optionTexts).toContain("Figure-8");
      expect(optionTexts).toContain("Lagrange L4/L5");
      expect(optionTexts).toContain("Broucke Orbit");
    });

    test("shows Pause, Reset and Speed slider", async ({ page }) => {
      await expect(page.getByRole("button", { name: /Pause|Play/ })).toBeVisible();
      await expect(page.getByRole("button", { name: /Reset/ })).toBeVisible();
      const modal = page.locator("[data-modal-content]");
      await expect(modal.locator('input[type="range"]')).toBeVisible();
    });

    test("shows energy and momentum display", async ({ page }) => {
      const modal = page.locator("[data-modal-content]");
      await expect(modal.getByText(/KE/)).toBeVisible();
      await expect(modal.getByText(/PE/)).toBeVisible();
      await expect(modal.getByText(/steps/)).toBeVisible();
    });

    test("switches preset on selection", async ({ page }) => {
      const select = page.locator("[data-modal-content] select");
      await select.selectOption("broucke");
      await expect(select).toHaveValue("broucke");
      await select.selectOption("lagrange");
      await expect(select).toHaveValue("lagrange");
    });

    test("card is present in gallery", async ({ page }) => {
      await page.goto("/gallery");
      await page.waitForSelector('[role="listitem"]', { timeout: 5000 });
      const card = page.locator('[role="listitem"]').filter({ hasText: "3-Body" });
      await expect(card.first()).toBeVisible();
    });
  });

  test.describe("Relativistic Orbits", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/gallery#relativistic-orbits");
      await page.waitForSelector("[data-modal-content]", { timeout: 8000 });
    });

    test.afterEach(async ({ page }) => {
      await page.keyboard.press("Escape");
    });

    test("deep link opens modal with Pause and Reset buttons", async ({ page }) => {
      await expect(page.getByRole("button", { name: /Pause|Play/ })).toBeVisible();
      await expect(page.getByRole("button", { name: /Reset/ })).toBeVisible();
    });

    test("shows Mass and Speed sliders", async ({ page }) => {
      const modal = page.locator("[data-modal-content]");
      await expect(modal.locator('label:has-text("Mass") input[type="range"]')).toBeVisible();
      await expect(modal.locator('label:has-text("Speed") input[type="range"]')).toBeVisible();
    });

    test("shows Schwarzschild radius, photon sphere and perihelion shift", async ({ page }) => {
      const modal = page.locator("[data-modal-content]");
      await expect(modal.getByText(/Rs/)).toBeVisible();
      await expect(modal.getByText(/Rph/)).toBeVisible();
      await expect(modal.getByText(/Δφ/)).toBeVisible();
    });

    test("increasing mass changes displayed values", async ({ page }) => {
      const massSlider = page.locator("[data-modal-content] label:has-text('Mass') input[type='range']");
      await massSlider.fill("100");
      const modal = page.locator("[data-modal-content]");
      await expect(modal.getByText("100")).toBeVisible();
    });

    test("card is present in gallery", async ({ page }) => {
      await page.keyboard.press("Escape");
      await page.goto("/gallery");
      const card = page.locator('[role="listitem"]').filter({ hasText: /Relativistic Orbits/ });
      await expect(card).toBeVisible();
    });
  });

  test.describe("Galaxy Formation", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/gallery#galaxy-formation");
      await page.waitForSelector("[data-modal-content]", { timeout: 8000 });
    });

    test.afterEach(async ({ page }) => {
      await page.keyboard.press("Escape");
    });

    test("deep link opens modal with Pause and Reset buttons", async ({ page }) => {
      await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Reset" })).toBeVisible();
    });

    test("has dark matter, angular momentum and speed sliders", async ({ page }) => {
      const modal = page.locator("[data-modal-content]");
      await expect(modal.locator('label:has-text("Dark matter") input[type="range"]')).toBeVisible();
      await expect(modal.locator('label:has-text("Angular momentum") input[type="range"]')).toBeVisible();
      await expect(modal.locator('label:has-text("Speed") input[type="range"]')).toBeVisible();
    });

    test("shows stats overlay with particles and dark matter", async ({ page }) => {
      const modal = page.locator("[data-modal-content]");
      await expect(modal.getByText(/Particles:/)).toBeVisible();
      await expect(modal.getByText(/Dark matter:/).last()).toBeVisible();
      await expect(modal.getByText(/Baryonic:/)).toBeVisible();
      await expect(modal.getByText(/Age:/)).toBeVisible();
    });

    test("changing dark matter fraction updates percentage", async ({ page }) => {
      const slider = page.locator("[data-modal-content] label:has-text('Dark matter') input[type='range']");
      await slider.fill("0.8");
      await expect(page.locator("[data-modal-content] .text-amber-400").first()).toContainText("80%");
    });

    test("card is present in gallery", async ({ page }) => {
      await page.goto("/gallery");
      await page.waitForSelector('[role="listitem"]', { timeout: 5000 });
      const card = page.locator('[role="listitem"]').filter({ hasText: /Galaxy Formation/ });
      await expect(card.first()).toBeVisible();
    });
  });
});
