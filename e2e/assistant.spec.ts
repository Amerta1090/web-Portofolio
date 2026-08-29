import { test, expect } from "@playwright/test";

test.describe("AssistantBot (detAIministic)", () => {
  test("FAB appears on the page (all pages)", async ({ page }) => {
    await page.goto("/");
    const fab = page.getByLabel("Buka assistant detAIministic");
    await expect(fab).toBeVisible();
  });

  test("opens the drawer with header + chips", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Buka assistant detAIministic").click();
    await expect(page.getByRole("dialog", { name: "detAIministic assistant" })).toBeVisible();
    await expect(page.getByText("detAIministic assistant")).toBeVisible();
    await expect(page.getByText("deterministic · no LLM · no backend")).toBeVisible();
  });

  test("clicking a quick-pick chip produces a reply", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Buka assistant detAIministic").click();
    const dialog = page.getByRole("dialog", { name: "detAIministic assistant" });
    const chip = dialog.getByRole("button", { name: /Skill/i }).first();
    await chip.click();
    // Wait for at least one assistant bubble (role=status) with content.
    await expect(dialog.locator('[role="status"]').first()).toBeVisible();
    await expect.poll(() => dialog.locator('[role="status"]').first().textContent()).toMatch(/.+/);
  });

  test("typing a message and pressing Enter shows a reply", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Buka assistant detAIministic").click();
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
    await page.getByLabel("Buka assistant detAIministic").click();
    const dialog = page.getByRole("dialog", { name: "detAIministic assistant" });
    await dialog.getByLabel("Buka engine").click();
    await expect(page.getByRole("dialog", { name: "Mekanisme engine deterministik" })).toBeVisible();
    await expect(page.getByText("Cara kerja engine")).toBeVisible();
    await expect(page.getByText(/100% deterministik/i)).toBeVisible();
  });

  test("closes the drawer", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Buka assistant detAIministic").click();
    await expect(page.getByRole("dialog", { name: "detAIministic assistant" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "detAIministic assistant" })).toHaveCount(0);
  });
});
