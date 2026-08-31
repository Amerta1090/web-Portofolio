import { expect, test } from "@playwright/test";

test.describe("Sentiment Gauge", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/gallery#sentiment-gauge");
    await page.waitForSelector("[data-modal-content]", { timeout: 8000 });
  });

  test.afterEach(async ({ page }) => {
    await page.keyboard.press("Escape");
  });

  test("deep link opens modal with textarea and stat panels", async ({ page }) => {
    const modal = page.locator("[data-modal-content]");
    await expect(modal.locator("textarea")).toBeVisible();
    await expect(modal.getByText("Total")).toBeVisible();
    await expect(modal.getByText("Magnitude")).toBeVisible();
    await expect(modal.getByText("Per-word score")).toBeVisible();
  });

  test("typing positive words shows a positive mood", async ({ page }) => {
    const textarea = page.locator("[data-modal-content] textarea");
    await textarea.fill("");
    await textarea.fill("amazing wonderful love");
    await expect(page.getByText("Very positive").first()).toBeVisible();
  });

  test("typing negative words shows a negative mood", async ({ page }) => {
    const textarea = page.locator("[data-modal-content] textarea");
    await textarea.fill("");
    await textarea.fill("terrible broken hate");
    await expect(page.getByText("Very negative").first()).toBeVisible();
  });

  test("Clear button empties the textarea", async ({ page }) => {
    await page.getByRole("button", { name: "Clear" }).click();
    const textarea = page.locator("[data-modal-content] textarea");
    await expect(textarea).toHaveValue("");
  });

  test("Sample button fills the textarea", async ({ page }) => {
    await page.getByRole("button", { name: "Sample" }).click();
    const textarea = page.locator("[data-modal-content] textarea");
    const value = await textarea.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });

  test("card is present in the gallery grid", async ({ page }) => {
    await page.goto("/gallery");
    const card = page.locator('[role="listitem"]').filter({ hasText: "Sentiment Gauge" });
    await expect(card.first()).toBeVisible();
  });
});
