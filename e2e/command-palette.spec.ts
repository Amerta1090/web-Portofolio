import { test, expect } from "@playwright/test";

async function waitReady(page: import("@playwright/test").Page) {
  await page.waitForFunction(
    () => (window as unknown as { __COMMAND_PALETTE_READY?: boolean }).__COMMAND_PALETTE_READY === true,
  );
}

test.describe("CommandPalette (detAIministic)", () => {
  test("opens via the header search button", async ({ page }) => {
    await page.goto("/");
    await waitReady(page);
    await page.getByRole("button", { name: /Cari/ }).click();
    await expect(page.getByRole("dialog", { name: "Command palette" })).toBeVisible();
    await expect(page.getByRole("searchbox")).toBeFocused();
  });

  test("opens via Ctrl+K and shows results", async ({ page }) => {
    await page.goto("/");
    await waitReady(page);
    await page.keyboard.press("Control+k");
    await expect(page.getByRole("dialog", { name: "Command palette" })).toBeVisible();
    const input = page.getByRole("searchbox");
    await input.fill("galaxy");
    await expect(page.getByRole("list", { name: "Hasil pencarian" })).toBeVisible();
    await expect(page.getByText("Galaxy Formation")).toBeVisible();
  });

  test("navigates to a lab on Enter", async ({ page }) => {
    await page.goto("/");
    await waitReady(page);
    await page.keyboard.press("Control+k");
    const input = page.getByRole("searchbox");
    await input.fill("galaxy");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/gallery#galaxy-formation/);
  });

  test("closes on Escape", async ({ page }) => {
    await page.goto("/");
    await waitReady(page);
    await page.keyboard.press("Control+k");
    await expect(page.getByRole("dialog", { name: "Command palette" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Command palette" })).toHaveCount(0);
  });

  // Regression: UA stylesheet gives `dialog { position: absolute; left: 0; right: 0 }`,
  // which pulls it OUT of the flex overlay — `justify-center` then has no effect and the
  // card renders flush left. Fix = `relative` so it is a real flex item (cf. GalleryGrid).
  test("is horizontally centered inside the viewport", async ({ page }) => {
    await page.goto("/");
    await waitReady(page);
    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog", { name: "Command palette" });
    await expect(dialog).toBeVisible();

    const box = await dialog.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    if (!box || !viewport) return;
    const centerOffset = Math.abs(box.x + box.width / 2 - viewport.width / 2);
    expect(centerOffset).toBeLessThanOrEqual(2);
    // Centered, not full-bleed: the panel keeps its max-w-xl card width.
    expect(box.width).toBeLessThan(viewport.width);
    // Still inside the overlay padding on both sides.
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  });
});
