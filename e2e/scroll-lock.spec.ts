import { expect, test } from "@playwright/test";
import { openExperiment, waitForIslandHydration } from "./hydration";

const bodyOverflow = (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.body.style.overflow);

/**
 * M4.2.3 — both React overlay writers use the shared window-scoped scroll
 * lock (`src/lib/scroll-lock.ts`). These tests pin the *wiring* (open locks,
 * close restores); the counter's mutual-exclusion itself is pinned
 * deterministically in `src/lib/scroll-lock.test.ts`, where two overlays can
 * be interleaved without depending on which overlay the page lets a reader
 * open on top of the other.
 */
test.describe("Scroll lock wiring (M4.2.3)", () => {
  test("gallery modal locks scroll while open, restores on Escape", async ({ page }) => {
    await page.goto("/gallery");
    expect(await bodyOverflow(page)).toBe("");
    await openExperiment(page, "Fractal Explorer");
    expect(await bodyOverflow(page)).toBe("hidden");
    await page.keyboard.press("Escape");
    await expect(page.locator("[data-modal-content]")).toHaveCount(0);
    expect(await bodyOverflow(page)).toBe("");
  });

  test("game menu locks scroll while open, restores on Escape", async ({ page }) => {
    await page.goto("/");
    // HeaderTools is client:load and mounts the menu button in server HTML —
    // wait for hydration or the opening click is silently dropped (T0.7).
    await waitForIslandHydration(page, 'button[aria-label="Open Menu"]');
    expect(await bodyOverflow(page)).toBe("");
    await page.getByRole("button", { name: "Open Menu" }).click();
    const sidebar = page.locator("div").filter({ hasText: /^Menu/ }).first();
    await expect(sidebar).toBeVisible();
    expect(await bodyOverflow(page)).toBe("hidden");
    await page.keyboard.press("Escape");
    await expect(sidebar).not.toBeVisible();
    expect(await bodyOverflow(page)).toBe("");
  });
});
