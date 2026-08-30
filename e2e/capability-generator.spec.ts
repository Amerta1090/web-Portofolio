import { expect, test } from "@playwright/test";

test.describe("CapabilityGenerator (tracery)", () => {
  test("renders in the About section with a deterministic label", async ({ page }) => {
    await page.goto("/");
    const card = page.getByText("detAIministic · grammar generator");
    await expect(card).toBeVisible();
    await expect(page.getByText("deterministic · no LLM")).toBeVisible();
  });

  test("initial output renders without template markers", async ({ page }) => {
    await page.goto("/");
    const output = page.getByRole("status", { name: "" }).first();
    await expect(output).toBeVisible();
    await expect.poll(() => output.textContent()).toMatch(/.+/);
    expect(await output.textContent()).not.toMatch(/#/);
  });

  test("Generate lagi cycles to a new deterministic output", async ({ page }) => {
    await page.goto("/");
    const output = page.getByRole("status").first();
    const before = await output.textContent();
    const maxIo = new Set([before]);
    for (let i = 0; i < 4; i++) {
      await page.getByRole("button", { name: "Generate lagi" }).click();
      const next = await output.textContent();
      expect(next).not.toMatch(/#/);
      const unique = new Set(maxIo);
      unique.add(next);
      if (unique.size > maxIo.size) break;
    }
    await expect.poll(() => output.textContent()).not.toBe(before);
    expect((await output.textContent())?.trim().length).toBeGreaterThan(0);
  });

  test("mode switch to Project changes the output to a grounded blurb", async ({ page }) => {
    await page.goto("/");
    const output = page.getByRole("status").first();
    await page.getByRole("button", { name: "Project", exact: true }).click();
    await expect.poll(() => output.textContent()).toMatch(/\.$/);
    const text = (await output.textContent()) ?? "";
    expect(text).not.toMatch(/#/);
    expect(text.length).toBeGreaterThan(0);
  });

  test("toggle reveals and hides the grammar source", async ({ page }) => {
    await page.goto("/");
    const reveal = page.getByRole("button", { name: "Lihat grammar" });
    await reveal.click();
    const pre = page.locator("pre");
    await expect(pre).toBeVisible();
    await expect(pre).toContainText("project_blurb");
    await expect(pre).toContainText("cap_build");
    await page.getByRole("button", { name: "Tutup grammar" }).click();
    await expect(pre).toHaveCount(0);
  });
});
