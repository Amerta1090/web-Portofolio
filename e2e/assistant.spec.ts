import { type Page, expect, test } from "@playwright/test";
import { waitForIslandHydration } from "./hydration";

/**
 * Open the assistant drawer, closing the pre-hydration race first.
 *
 * The FAB lives in `GlobalChrome` (`client:load`), which is the island mounted last
 * on every page. Its markup — and therefore the button and its accessible name — is
 * in the server HTML, so a click issued right after `goto` can land before React
 * attaches any handler. The click is then dropped silently: no drawer, no error,
 * and the test fails 30 s later on a `locator.fill` timeout for the input that the
 * click was supposed to reveal. That is exactly how
 * "typing a message and pressing Enter shows a reply" failed in a full
 * `--workers=1` run, and it is invisible to a reader because the failure points at
 * a field, not at the button.
 *
 * Measured with a browser probe driving the same `goto` → click shape 10 times at
 * `waitUntil: "commit"`: **8/10 opened without this wait, 10/10 with it**. The probe
 * commits harder than Playwright's default `goto` (which waits for `load`), which is
 * why the full suite sees roughly 1 failure in 251 rather than 2 in 10.
 */
async function openAssistant(page: Page) {
  await waitForIslandHydration(page, "[aria-label='Buka assistant detAIministic']");
  await page.getByLabel("Buka assistant detAIministic").click();
}

test.describe("AssistantBot (detAIministic)", () => {
  test("FAB appears on the page (all pages)", async ({ page }) => {
    await page.goto("/");
    const fab = page.getByLabel("Buka assistant detAIministic");
    await expect(fab).toBeVisible();
  });

  test("opens the drawer with header + chips", async ({ page }) => {
    await page.goto("/");
    await openAssistant(page);
    await expect(page.getByRole("dialog", { name: "detAIministic assistant" })).toBeVisible();
    await expect(page.getByText("detAIministic assistant")).toBeVisible();
    await expect(page.getByText("deterministic · no LLM · no backend")).toBeVisible();
  });

  test("clicking a quick-pick chip produces a reply", async ({ page }) => {
    await page.goto("/");
    await openAssistant(page);
    const dialog = page.getByRole("dialog", { name: "detAIministic assistant" });
    const chip = dialog.getByRole("button", { name: /Skill/i }).first();
    await chip.click();
    // Wait for at least one assistant bubble (role=status) with content.
    await expect(dialog.locator('[role="status"]').first()).toBeVisible();
    await expect.poll(() => dialog.locator('[role="status"]').first().textContent()).toMatch(/.+/);
  });

  test("typing a message and pressing Enter shows a reply", async ({ page }) => {
    await page.goto("/");
    await openAssistant(page);
    const dialog = page.getByRole("dialog", { name: "detAIministic assistant" });
    const input = dialog.getByLabel("Pesan ke assistant");
    await input.fill("apa saja skill kamu?");
    await input.press("Enter");
    // User bubble appears.
    await expect(dialog.getByText("apa saja skill kamu?")).toBeVisible();
    // Assistant reply streams in; await a non-empty bubble text.
    await expect.poll(() => dialog.locator('[role="status"]').last().textContent()).toMatch(/.+/);
  });

  test("opens the engine transparency modal", async ({ page }) => {
    await page.goto("/");
    await openAssistant(page);
    const dialog = page.getByRole("dialog", { name: "detAIministic assistant" });
    await dialog.getByLabel("Buka engine").click();
    await expect(
      page.getByRole("dialog", { name: "Mekanisme engine deterministik" }),
    ).toBeVisible();
    await expect(page.getByText("Cara kerja engine")).toBeVisible();
    await expect(page.getByText(/100% deterministik/i)).toBeVisible();
  });

  test("closes the drawer", async ({ page }) => {
    await page.goto("/");
    await openAssistant(page);
    await expect(page.getByRole("dialog", { name: "detAIministic assistant" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "detAIministic assistant" })).toHaveCount(0);
  });

  test("focus trap: initial focus pada input dan Tab berputar di dalam drawer", async ({
    page,
  }) => {
    await page.goto("/");
    await openAssistant(page);
    const dialog = page.getByRole("dialog", { name: "detAIministic assistant" });
    const input = dialog.getByLabel("Pesan ke assistant");
    // Initial focus → input (via useFocusTrap).
    await expect(input).toBeFocused();
    // Aktifkan tombol kirim agar ia ikut dalam siklus fokus.
    await input.fill("halo");
    const focusableCount = await dialog
      .locator(
        'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), [href]:not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])',
      )
      .count();
    // Setelah sebanyak focusables kali Tab, fokus kembali ke input (wrap).
    for (let i = 0; i < focusableCount; i++) {
      await page.keyboard.press("Tab");
    }
    await expect(input).toBeFocused();
  });
});
