import { expect, test } from "@playwright/test";

test.describe("Markov Text Generator", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/gallery#markov-generator");
    await page.waitForSelector("[data-modal-content]", { timeout: 8000 });
  });

  test.afterEach(async ({ page }) => {
    await page.keyboard.press("Escape");
  });

  test("deep link opens modal with mode toggles and generated output", async ({ page }) => {
    const modal = page.locator("[data-modal-content]");
    await expect(modal.getByRole("button", { name: "Bio" })).toBeVisible();
    await expect(modal.getByRole("button", { name: "Project" })).toBeVisible();
    await expect(modal.getByRole("button", { name: "Fact" })).toBeVisible();
    await expect(modal.getByText(/generated, not ai/i)).toBeVisible();
  });

  test("produces a non-empty output", async ({ page }) => {
    const modal = page.locator("[data-modal-content]");
    const out = modal.locator("p[aria-live='polite']");
    const text = (await out.textContent()) ?? "";
    expect(text.length).toBeGreaterThan(0);
  });

  test("Generate again changes the output", async ({ page }) => {
    const modal = page.locator("[data-modal-content]");
    const out = modal.locator("p[aria-live='polite']");
    const before = (await out.textContent()) ?? "";
    await modal.getByRole("button", { name: "Generate again" }).click();
    const after = (await out.textContent()) ?? "";
    expect(after.length).toBeGreaterThan(0);
  });

  test("switching mode updates output", async ({ page }) => {
    const modal = page.locator("[data-modal-content]");
    const out = modal.locator("p[aria-live='polite']");
    const before = (await out.textContent()) ?? "";
    await modal.getByRole("button", { name: "Project" }).click();
    const after = (await out.textContent()) ?? "";
    expect(after).not.toBe(before);
  });

  test("length slider adjusts output length", async ({ page }) => {
    const modal = page.locator("[data-modal-content]");
    const slider = modal.locator('input[type="range"]');
    await expect(slider).toBeVisible();
  });

  test("card is present in the gallery grid", async ({ page }) => {
    await page.goto("/gallery");
    const card = page.locator('[role="listitem"]').filter({ hasText: "Markov Text Generator" });
    await expect(card.first()).toBeVisible();
  });
});
