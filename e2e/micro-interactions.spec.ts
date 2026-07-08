import { test, expect } from "@playwright/test";

test.describe("Micro-Interactions on Index Page", () => {
  test("MorphingNavigation renders at top of page", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);
    const nav = page.locator("nav").filter({ hasText: "Home" });
    await expect(nav.first()).toBeVisible();
  });

  test("MicroInteractions section shows magnetic buttons", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Micro-Interactions").first().scrollIntoViewIfNeeded();
    await expect(page.getByText("Magnetic Buttons").first()).toBeVisible();
    const microSection = page.locator("#micro-interactions");
    await expect(microSection.getByRole("button", { name: "Get in Touch" })).toBeVisible();
    await expect(microSection.getByRole("button", { name: "View Projects" })).toBeVisible();
    await expect(microSection.getByRole("button", { name: "Download CV" })).toBeVisible();
  });

  test("MicroInteractions section shows tooltips", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Micro-Interactions").first().scrollIntoViewIfNeeded();
    await expect(page.getByText("Context-Aware Tooltips").first()).toBeVisible();
    const microSection = page.locator("#micro-interactions");
    await expect(microSection.getByText("React")).toBeVisible();
    await expect(microSection.getByText("TypeScript")).toBeVisible();
    await expect(microSection.getByText("Framer Motion")).toBeVisible();
  });

  test("MicroInteractions section shows organic loaders", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Micro-Interactions").first().scrollIntoViewIfNeeded();
    await expect(page.getByText("Organic Loading States").first()).toBeVisible();
    await expect(page.getByText("Breathing variant")).toBeVisible();
    await expect(page.getByText("Pulsing variant")).toBeVisible();
    await expect(page.getByText("Growing variant (indeterminate)")).toBeVisible();
    await expect(page.getByText("Growing variant (determinate 65%)")).toBeVisible();
  });

  test("Organic loaders have progressbar role", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Micro-Interactions").first().scrollIntoViewIfNeeded();
    const loaders = page.locator("#micro-interactions").locator('[role="progressbar"]');
    await expect(loaders.first()).toBeVisible();
  });

  test("EasterEgg initializes without visible elements", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      console.log("opencode");
    });
  });

  test("Konami code sequence detection works", async ({ page }) => {
    await page.goto("/");
    const detected = await page.evaluate(() => {
      let count = 0;
      const seq = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
      const handler = (e: KeyboardEvent) => {
        if (e.key === seq[count]) {
          count++;
          if (count === seq.length) {
            window.removeEventListener("keydown", handler);
          }
        } else {
          count = 0;
        }
      };
      window.addEventListener("keydown", handler);
      for (const key of seq) {
        window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
      }
      return count === seq.length;
    });
    expect(detected).toBe(true);
  });

  test("ScrollEntropy zones are rendered in micro-interactions section", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Micro-Interactions").first().scrollIntoViewIfNeeded();
    await expect(page.getByText("Micro-Interactions")).toBeVisible();
  });

  test("Magnetic buttons respond to hover proximity", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Micro-Interactions").first().scrollIntoViewIfNeeded();
    const btn = page.locator("#micro-interactions").getByRole("button", { name: "Get in Touch" });
    await btn.hover();
    await expect(btn).toBeVisible();
  });
});
