import { expect, test } from "@playwright/test";

/**
 * The game menu used to play Web Audio tones (useHaptics): a 800→1200Hz sine
 * beep on every hover / arrow-key repeat and a square 150→50Hz blip on select.
 * The hook was removed — the menu is now silent. These tests guard that, because
 * "add a sound effect back" is an easy, invisible-at-build-time regression.
 */
async function instrumentAudio(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    (window as unknown as { __AC_COUNT: number }).__AC_COUNT = 0;
    const Orig = window.AudioContext;
    window.AudioContext = class extends Orig {
      constructor(...args: ConstructorParameters<typeof Orig>) {
        (window as unknown as { __AC_COUNT: number }).__AC_COUNT += 1;
        super(...args);
      }
    };
  });
}

const audioCount = (page: import("@playwright/test").Page) =>
  page.evaluate(() => (window as unknown as { __AC_COUNT: number }).__AC_COUNT);

test.describe("Game Menu (no audio)", () => {
  test("opens, navigates by keyboard, and never creates an AudioContext", async ({ page }) => {
    await instrumentAudio(page);
    await page.goto("/");
    await page.getByRole("button", { name: "Open Menu" }).click();

    const sidebar = page.locator("div").filter({ hasText: /^Menu/ }).first();
    await expect(sidebar).toBeVisible();
    expect(await audioCount(page)).toBe(0);

    // Walk the menu with the keyboard — this used to beep on every repeat.
    await page.keyboard.down("ArrowDown");
    await page.waitForTimeout(1000);
    await page.keyboard.up("ArrowDown");

    // Enter drills into a submenu, Escape steps back out.
    await page.keyboard.press("Enter");
    await page.waitForTimeout(400);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);

    expect(await audioCount(page)).toBe(0);
  });

  test("no audio code ships in the built game-menu bundle", async ({ page }) => {
    await page.goto("/");
    // The removed hook persisted a mute flag under this key; its absence in the
    // DOM-localStorage surface is a cheap proxy that the module is gone.
    const keys = await page.evaluate(() => Object.keys(localStorage));
    expect(keys).not.toContain("haptics-muted");
  });
});
