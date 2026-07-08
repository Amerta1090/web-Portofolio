import { test, expect } from "@playwright/test";

test.describe("Gallery page", () => {
  test("loads with experiment cards", async ({ page }) => {
    await page.goto("/gallery");
    await expect(page.getByRole("heading", { name: "Creative Lab" })).toBeVisible();
    const cards = page.locator('[role="list"] > [role="listitem"]');
    await expect(cards).toHaveCount(13);
  });

  test("Fractal Explorer card is present", async ({ page }) => {
    await page.goto("/gallery");
    await expect(page.getByText("Fractal Explorer")).toBeVisible();
    const card = page.locator('[role="listitem"]').filter({ hasText: "Fractal Explorer" });
    await expect(card).toBeVisible();
    await expect(card.getByText("WebGL", { exact: true })).toBeVisible();
    await expect(card.getByText("Fractal", { exact: true })).toBeVisible();
  });

  test("clicking Fractal Explorer opens modal with controls", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Fractal Explorer").first().click();
    await expect(page.getByRole("button", { name: "Mandelbrot" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Julia" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Amber" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Bookmark" })).toBeVisible();
  });

  test("Julia toggle shows Cx/Cy controls in modal", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Fractal Explorer").first().click();
    await page.getByRole("button", { name: "Julia" }).click();
    const modal = page.locator("[data-modal-content]");
    await expect(modal.getByText("Cx")).toBeVisible();
    await expect(modal.getByText("Cy", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Morph" })).toBeVisible();
  });

  test("morph toggle works in Julia mode", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Fractal Explorer").first().click();
    await page.getByRole("button", { name: "Julia" }).click();
    await page.getByRole("button", { name: "Morph" }).click();
    await expect(page.getByRole("button", { name: "Morph On" })).toBeVisible();
    await expect(page.getByText("Speed")).toBeVisible();
  });

  test("palette buttons switch active state", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Fractal Explorer").first().click();
    await expect(page.getByRole("button", { name: "Amber" })).toBeVisible();
    await page.getByRole("button", { name: "Fire" }).click();
    await expect(page.getByRole("button", { name: "Fire" })).toBeVisible();
  });

  test("Pan and Zoom mode toggle exist", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Fractal Explorer").first().click();
    await expect(page.getByRole("button", { name: "Pan" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Zoom" })).toBeVisible();
  });

  test("Bookmark button is present in modal", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Fractal Explorer").first().click();
    await expect(page.getByRole("button", { name: "Bookmark" })).toBeVisible();
  });

  test("closes modal with Escape", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Fractal Explorer").first().click();
    await expect(page.getByRole("button", { name: "Mandelbrot" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Mandelbrot" })).not.toBeVisible();
  });

  test("deep link via URL hash opens experiment", async ({ page }) => {
    await page.goto("/gallery#fractal-explorer");
    await expect(page.getByRole("button", { name: "Mandelbrot" })).toBeVisible({ timeout: 5000 });
  });

  test("Iter slider is adjustable", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Fractal Explorer").first().click();
    const slider = page.locator('label:has-text("Iter") input[type="range"]');
    await expect(slider).toBeVisible();
    expect(Number(await slider.inputValue())).toBe(256);
  });

  test("Shift slider is adjustable", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Fractal Explorer").first().click();
    const slider = page.locator('label:has-text("Shift") input[type="range"]');
    await expect(slider).toBeVisible();
    await slider.fill("50");
    expect(Number(await slider.inputValue())).toBe(50);
  });

  test("Interactive Canvas card is present", async ({ page }) => {
    await page.goto("/gallery");
    await expect(page.getByText("Interactive Canvas")).toBeVisible();
    const card = page.locator('[role="listitem"]').filter({ hasText: "Interactive Canvas" });
    await expect(card).toBeVisible();
    await expect(card.getByText("Canvas", { exact: true })).toBeVisible();
    await expect(card.getByText("Whiteboard", { exact: true })).toBeVisible();
  });

  test("Interactive Canvas modal shows toolbar with drawing tools", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Interactive Canvas").first().click();
    await expect(page.getByTitle("Pen (P)")).toBeVisible();
    await expect(page.getByTitle("Eraser (E)")).toBeVisible();
    await expect(page.getByTitle("Node (N)")).toBeVisible();
    await expect(page.getByTitle("Pan (V)")).toBeVisible();
  });

  test("Interactive Canvas shows export and undo/redo buttons", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Interactive Canvas").first().click();
    await expect(page.getByRole("button", { name: "PNG" })).toBeVisible();
    await expect(page.getByRole("button", { name: "SVG" })).toBeVisible();
    await expect(page.getByRole("button", { name: "↶ Undo" })).toBeVisible();
    await expect(page.getByRole("button", { name: "↷ Redo" })).toBeVisible();
    await expect(page.getByRole("button", { name: "🗑 Clear" })).toBeVisible();
  });

  test("Interactive Canvas switches tool by clicking toolbar buttons", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Interactive Canvas").first().click();
    await page.getByTitle("Eraser (E)").click();
    const eraserBtn = page.getByTitle("Eraser (E)");
    await expect(eraserBtn).toBeVisible();
    await page.getByTitle("Node (N)").click();
    await expect(page.getByTitle("Node (N)")).toBeVisible();
  });

  test("Interactive Canvas deep link opens via URL hash", async ({ page }) => {
    await page.goto("/gallery#interactive-canvas");
    await expect(page.getByTitle("Pen (P)")).toBeVisible({ timeout: 5000 });
  });

  test("Strange Attractor Zoo card is present", async ({ page }) => {
    await page.goto("/gallery");
    const card = page.locator('[role="listitem"]').filter({ hasText: "Strange Attractor Zoo" });
    await expect(card).toBeVisible();
    await expect(card.getByText("Chaos", { exact: true })).toBeVisible();
  });

  test("Strange Attractor Zoo modal shows attractor toggles", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Strange Attractor Zoo").first().click();
    await expect(page.getByRole("button", { name: "Lorenz" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Rössler" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Chaos Mode" })).toBeVisible();
  });

  test("Strange Attractor switches attractor on click", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Strange Attractor Zoo").first().click();
    await page.getByRole("button", { name: "Rössler" }).click();
    await expect(page.getByRole("button", { name: "Rössler" })).toBeVisible();
  });

  test("Double Pendulum Chaos card is present", async ({ page }) => {
    await page.goto("/gallery");
    await expect(page.getByText("Double Pendulum Chaos")).toBeVisible();
    const card = page.locator('[role="listitem"]').filter({ hasText: "Double Pendulum Chaos" });
    await expect(card).toBeVisible();
  });

  test("Double Pendulum Chaos modal shows controls", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Double Pendulum Chaos").first().click();
    await expect(page.getByRole("button", { name: "Phase Space" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset" })).toBeVisible();
    await expect(page.getByText(/λ/)).toBeVisible();
  });

  test("Double Pendulum Chaos toggles phase space", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Double Pendulum Chaos").first().click();
    await page.getByRole("button", { name: "Phase Space" }).click();
    await expect(page.getByRole("button", { name: "Phase Space" })).toBeVisible();
  });

  test("Logistic Map card is present", async ({ page }) => {
    await page.goto("/gallery");
    await expect(page.getByText("Logistic Map")).toBeVisible();
    const card = page.locator('[role="listitem"]').filter({ hasText: "Logistic Map" });
    await expect(card).toBeVisible();
  });

  test("Logistic Map modal shows controls", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Logistic Map").first().click();
    await expect(page.getByRole("button", { name: "Cobweb" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Auto Sweep" })).toBeVisible();
  });

  test("Logistic Map cobweb toggle works", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Logistic Map").first().click();
    await page.getByRole("button", { name: "Cobweb" }).click();
    await expect(page.getByRole("button", { name: "Cobweb" })).toBeVisible();
  });

  test("Logistic Map r slider is adjustable", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Logistic Map").first().click();
    const slider = page.locator('label:has-text("r") input[type="range"]');
    await expect(slider).toBeVisible();
    await slider.fill("3.8");
    expect(Number(await slider.inputValue())).toBe(3.8);
  });

  test("Butterfly Effect card is present", async ({ page }) => {
    await page.goto("/gallery");
    const card = page.locator('[role="listitem"]').filter({ hasText: "Butterfly Effect Sandbox" });
    await expect(card).toBeVisible();
    await expect(card.getByText("Canvas", { exact: true })).toBeVisible();
  });

  test("Butterfly Effect modal shows system and chaos controls", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Butterfly Effect Sandbox").first().click();
    await expect(page.getByRole("button", { name: "Chaos" })).toBeVisible();
    await expect(page.getByText(/λ/)).toBeVisible();
    await expect(page.getByText("Click canvas to set")).toBeVisible();
  });

  test("Butterfly Effect Lorenz/Rössler toggle works", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Butterfly Effect Sandbox").first().click();
    const lorenzBtn = page.getByRole("button", { name: "Lorenz" });
    await expect(lorenzBtn).toBeVisible();
    await lorenzBtn.click();
    await expect(page.getByRole("button", { name: "Rössler" })).toBeVisible();
  });

  test("deep link for strange-attractor opens via URL hash", async ({ page }) => {
    await page.goto("/gallery#strange-attractor");
    await expect(page.getByRole("button", { name: "Lorenz" })).toBeVisible({ timeout: 5000 });
  });

  test("deep link for logistic-map opens via URL hash", async ({ page }) => {
    await page.goto("/gallery#logistic-map");
    await expect(page.getByRole("button", { name: "Cobweb" })).toBeVisible({ timeout: 5000 });
  });
});
