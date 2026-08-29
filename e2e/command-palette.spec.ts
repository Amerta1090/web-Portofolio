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
});
