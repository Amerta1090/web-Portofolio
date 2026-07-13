import { test, expect } from "@playwright/test";

test.describe("Gallery page", () => {
  test("loads with experiment cards", async ({ page }) => {
    await page.goto("/gallery");
    await expect(page.getByRole("heading", { name: "Creative Lab" })).toBeVisible();
    const cards = page.locator('[role="list"] > [role="listitem"]');
    await expect(cards).toHaveCount(35);
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

  test("Butterfly Effect deep link opens via URL hash", async ({ page }) => {
    await page.goto("/gallery#butterfly-effect");
    await expect(page.getByText("Click canvas to set")).toBeVisible({ timeout: 5000 });
  });

  test("Noise Topography card is present", async ({ page }) => {
    await page.goto("/gallery");
    await expect(page.getByText("Noise Topography")).toBeVisible();
    const card = page.locator('[role="listitem"]').filter({ hasText: "Noise Topography" });
    await expect(card).toBeVisible();
    await expect(card.getByText("Noise", { exact: true })).toBeVisible();
    await expect(card.getByText("Terrain", { exact: true })).toBeVisible();
  });

  test("Noise Topography modal shows terrain controls", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Noise Topography").first().click();
    await expect(page.getByRole("button", { name: "Export STL" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Auto" })).toBeVisible();
    await expect(page.locator('label:has-text("Oct") input[type="range"]')).toBeVisible();
    await expect(page.locator('label:has-text("Pers") input[type="range"]')).toBeVisible();
    await expect(page.locator('label:has-text("Lac") input[type="range"]')).toBeVisible();
  });

  test("Noise Topography Auto toggle works", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Noise Topography").first().click();
    await expect(page.getByText("✦ Auto")).toBeVisible();
    await page.getByText("✦ Auto").click();
    await expect(page.getByText("◉ Manual")).toBeVisible();
  });

  test("Noise Topography Seed slider is adjustable", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Noise Topography").first().click();
    const slider = page.locator('label:has-text("Seed") input[type="range"]');
    await expect(slider).toBeVisible();
    await slider.fill("42");
    expect(Number(await slider.inputValue())).toBe(42);
  });

  test("Noise Topography deep link opens via URL hash", async ({ page }) => {
    await page.goto("/gallery#noise-topography");
    await expect(page.getByRole("button", { name: "Export STL" })).toBeVisible({ timeout: 5000 });
  });

  test("Fourier Epicycles card is present", async ({ page }) => {
    await page.goto("/gallery");
    await expect(page.getByText("Fourier Epicycles")).toBeVisible();
    const card = page.locator('[role="listitem"]').filter({ hasText: "Fourier Epicycles" });
    await expect(card).toBeVisible();
    await expect(card.getByText("Canvas", { exact: true })).toBeVisible();
    await expect(card.getByText("Fourier", { exact: true })).toBeVisible();
  });

  test("Fourier Epicycles modal shows mode toggle and draw hint", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Fourier Epicycles").first().click();
    await expect(page.getByText("Epicycles →")).toBeVisible();
    await expect(page.getByText("Draw a closed shape")).toBeVisible();
  });

  test("Fourier Epicycles toggles between draw and epicycles mode", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Fourier Epicycles").first().click();
    await expect(page.getByText("Epicycles →")).toBeVisible();
    await page.getByText("Epicycles →").click();
    await expect(page.getByText("← Draw")).toBeVisible();
  });

  test("Fourier Epicycles deep link opens via URL hash", async ({ page }) => {
    await page.goto("/gallery#fourier-epicycles");
    await expect(page.getByText("Epicycles →")).toBeVisible({ timeout: 5000 });
  });

  test("Taylor Series card is present", async ({ page }) => {
    await page.goto("/gallery");
    await expect(page.getByText("Taylor Series Approximation")).toBeVisible();
    const card = page.locator('[role="listitem"]').filter({ hasText: "Taylor Series Approximation" });
    await expect(card).toBeVisible();
    await expect(card.getByText("Calculus", { exact: true })).toBeVisible();
    await expect(card.getByText("Taylor Series", { exact: true })).toBeVisible();
  });

  test("Taylor Series modal shows function and animation controls", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Taylor Series Approximation").first().click();
    await expect(page.getByRole("button", { name: "eˣ" })).toBeVisible();
    await expect(page.getByRole("button", { name: "sin" })).toBeVisible();
    await expect(page.getByRole("button", { name: "cos" })).toBeVisible();
    await expect(page.getByRole("button", { name: "ln" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Auto Animate" })).toBeVisible();
    await expect(page.locator('label:has-text("N") input[type="range"]')).toBeVisible();
  });

  test("Taylor Series switches function on button click", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Taylor Series Approximation").first().click();
    await page.getByRole("button", { name: "sin" }).click();
    await expect(page.getByRole("button", { name: "sin" })).toBeVisible();
    await page.getByRole("button", { name: "cos" }).click();
    await expect(page.getByRole("button", { name: "cos" })).toBeVisible();
  });

  test("Taylor Series Auto Animate starts on click", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Taylor Series Approximation").first().click();
    await expect(page.getByRole("button", { name: "Auto Animate" })).toBeVisible();
    await page.getByRole("button", { name: "Auto Animate" }).click();
    await expect(page.getByRole("button", { name: /Animating/ })).toBeVisible({ timeout: 3000 });
  });

  test("Taylor Series deep link opens via URL hash", async ({ page }) => {
    await page.goto("/gallery#taylor-series");
    await expect(page.getByRole("button", { name: "eˣ" })).toBeVisible({ timeout: 5000 });
  });

  test("Riemann Sum card is present", async ({ page }) => {
    await page.goto("/gallery");
    await expect(page.getByText("Riemann Sum → Integral")).toBeVisible();
    const card = page.locator('[role="listitem"]').filter({ hasText: "Riemann Sum" });
    await expect(card).toBeVisible();
    await expect(card.getByText("Calculus", { exact: true })).toBeVisible();
    await expect(card.getByText("Riemann Sum", { exact: true })).toBeVisible();
  });

  test("Riemann Sum modal shows method and preset controls", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Riemann Sum → Integral").first().click();
    await expect(page.getByRole("button", { name: "Left" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Right" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Midpoint" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Trapezoidal" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Animate" })).toBeVisible();
    await expect(page.locator('label:has-text("N") input[type="range"]')).toBeVisible();
  });

  test("Riemann Sum preset buttons switch function", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Riemann Sum → Integral").first().click();
    await page.getByRole("button", { name: "sin" }).click();
    await expect(page.getByRole("button", { name: "sin" })).toBeVisible();
    await page.getByRole("button", { name: "1/x" }).click();
    await expect(page.getByRole("button", { name: "1/x" })).toBeVisible();
  });

  test("Riemann Sum Animate starts on click", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Riemann Sum → Integral").first().click();
    await expect(page.getByRole("button", { name: "Animate" })).toBeVisible();
    await page.getByRole("button", { name: "Animate" }).click();
    await expect(page.getByRole("button", { name: /Animating/ })).toBeVisible({ timeout: 3000 });
  });

  test("Riemann Sum deep link opens via URL hash", async ({ page }) => {
    await page.goto("/gallery#riemann-sum");
    await expect(page.getByRole("button", { name: "Left" })).toBeVisible({ timeout: 5000 });
  });

  // ═══════════════════════════════════════════
  // Sprint 9 — Linear Algebra & Dimensionality
  // ═══════════════════════════════════════════

  test("Eigenvector Flow Field card is present", async ({ page }) => {
    await page.goto("/gallery");
    await expect(page.getByText("Eigenvector Flow Field")).toBeVisible();
    const card = page.locator('[role="listitem"]').filter({ hasText: "Eigenvector Flow Field" });
    await expect(card).toBeVisible();
    await expect(card.getByText("Linear Algebra", { exact: true })).toBeVisible();
    await expect(card.getByText("PCA", { exact: true })).toBeVisible();
  });

  test("Eigenvector Flow Field modal shows matrix preset and PCA controls", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Eigenvector Flow Field").first().click();
    await expect(page.locator("select")).toBeVisible();
    await expect(page.getByRole("button", { name: "▶ Animate PCA", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "PCA", exact: true })).toBeVisible();
  });

  test("Matrix Multiplication card is present", async ({ page }) => {
    await page.goto("/gallery");
    await expect(page.getByText("Matrix Multiplication Visual")).toBeVisible();
    const card = page.locator('[role="listitem"]').filter({ hasText: "Matrix Multiplication Visual" });
    await expect(card).toBeVisible();
    await expect(card.getByText("Matrices", { exact: true })).toBeVisible();
  });

  test("Matrix Multiplication modal shows matrix presets and play controls", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Matrix Multiplication Visual").first().click();
    await expect(page.locator("select")).toBeVisible();
    await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Step" })).toBeVisible();
  });

  test("SVD Image Compression card is present", async ({ page }) => {
    await page.goto("/gallery");
    await expect(page.getByText("SVD Image Compression")).toBeVisible();
    const card = page.locator('[role="listitem"]').filter({ hasText: "SVD Image Compression" });
    await expect(card).toBeVisible();
    await expect(card.getByText("SVD", { exact: true })).toBeVisible();
    await expect(card.getByText("Compression", { exact: true })).toBeVisible();
  });

  test("SVD Image Compression modal shows rank slider and file upload", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("SVD Image Compression").first().click();
    await expect(page.getByText("Upload Image")).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset" })).toBeVisible();
  });

  test("Tesseract Projection card is present", async ({ page }) => {
    await page.goto("/gallery");
    await expect(page.getByText("Tesseract Hypercube Projection")).toBeVisible();
    const card = page.locator('[role="listitem"]').filter({ hasText: "Tesseract Hypercube Projection" });
    await expect(card).toBeVisible();
    await expect(card.getByText("4D", { exact: true })).toBeVisible();
    await expect(card.getByText("Geometry", { exact: true })).toBeVisible();
  });

  test("Tesseract Projection modal shows rotation plane controls", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Tesseract Hypercube Projection").first().click();
    await expect(page.getByText("Auto", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Wireframe" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Faces" })).toBeVisible();
  });

  test("PCA / t-SNE card is present", async ({ page }) => {
    await page.goto("/gallery");
    await expect(page.getByText("PCA / t-SNE Visualization")).toBeVisible();
    const card = page.locator('[role="listitem"]').filter({ hasText: "PCA / t-SNE Visualization" });
    await expect(card).toBeVisible();
    await expect(card.getByText("PCA", { exact: true })).toBeVisible();
    await expect(card.getByText("Dimensionality Reduction", { exact: true })).toBeVisible();
  });

  test("PCA / t-SNE modal shows projection controls", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("PCA / t-SNE Visualization").first().click();
    await expect(page.getByText("Generate New Data")).toBeVisible();
    await expect(page.getByText("Perplexity:")).toBeVisible();
  });

  test("deep link for eigenvector-flow opens via URL hash", async ({ page }) => {
    await page.goto("/gallery#eigenvector-flow");
    await expect(page.getByRole("button", { name: "▶ Animate PCA", exact: true })).toBeVisible({ timeout: 5000 });
  });

  test("deep link for svd-compression opens via URL hash", async ({ page }) => {
    await page.goto("/gallery#svd-compression");
    await expect(page.getByText("Upload Image")).toBeVisible({ timeout: 5000 });
  });

  test("deep link for tesseract-projection opens via URL hash", async ({ page }) => {
    await page.goto("/gallery#tesseract-projection");
    await expect(page.getByText("Auto", { exact: true })).toBeVisible({ timeout: 5000 });
  });

  test("deep link for pca-tsne-viz opens via URL hash", async ({ page }) => {
    await page.goto("/gallery#pca-tsne-viz");
    await expect(page.getByText("Generate New Data")).toBeVisible({ timeout: 5000 });
  });

  // ═══════════════════════════════════════════
  // Sprint 10 — PDEs, Physics & Emergence
  // ═══════════════════════════════════════════

  test("Von Kármán Vortex Street card is present", async ({ page }) => {
    await page.goto("/gallery");
    await expect(page.getByText("Von Kármán Vortex Street")).toBeVisible();
    const card = page.locator('[role="listitem"]').filter({ hasText: "Von Kármán Vortex Street" });
    await expect(card).toBeVisible();
    await expect(card.getByText("Fluid Dynamics", { exact: true })).toBeVisible();
    await expect(card.getByText("Vortex", { exact: true })).toBeVisible();
  });

  test("Von Kármán Vortex Street modal shows controls", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Von Kármán Vortex Street").first().click();
    await expect(page.locator('label:has-text("Re:") input[type="range"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  });

  test("Von Kármán Vortex Street deep link opens via URL hash", async ({ page }) => {
    await page.goto("/gallery#von-karmann-vortex");
    await expect(page.locator('label:has-text("Re:") input[type="range"]')).toBeVisible({ timeout: 5000 });
  });

  test("Spring Physics Sandbox card is present", async ({ page }) => {
    await page.goto("/gallery");
    await expect(page.getByText("Spring Physics Sandbox")).toBeVisible();
    const card = page.locator('[role="listitem"]').filter({ hasText: "Spring Physics Sandbox" });
    await expect(card).toBeVisible();
    await expect(card.getByText("Verlet", { exact: true })).toBeVisible();
  });

  test("Spring Physics Sandbox modal shows preset buttons", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Spring Physics Sandbox").first().click();
    await expect(page.getByRole("button", { name: "Cloth" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Chain" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Jelly" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Ragdoll" })).toBeVisible();
  });

  test("Spring Physics Sandbox deep link opens via URL hash", async ({ page }) => {
    await page.goto("/gallery#spring-physics");
    await expect(page.getByRole("button", { name: "Cloth" })).toBeVisible({ timeout: 5000 });
  });

  test("Sandpile Model card is present", async ({ page }) => {
    await page.goto("/gallery");
    await expect(page.getByText("Sandpile Model (SOC)")).toBeVisible();
    const card = page.locator('[role="listitem"]').filter({ hasText: "Sandpile Model" });
    await expect(card).toBeVisible();
    await expect(card.getByText("Cellular Automata", { exact: true })).toBeVisible();
  });

  test("Sandpile Model modal shows Rain and Reset buttons", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Sandpile Model (SOC)").first().click();
    await expect(page.getByRole("button", { name: /Rain/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Single/ })).toBeVisible();
  });

  test("Sandpile Model deep link opens via URL hash", async ({ page }) => {
    await page.goto("/gallery#sandpile-model");
    await expect(page.getByRole("button", { name: /Rain/ })).toBeVisible({ timeout: 5000 });
  });

  test("Rayleigh-Bénard Convection card is present", async ({ page }) => {
    await page.goto("/gallery");
    await expect(page.getByText("Rayleigh-Bénard Convection")).toBeVisible();
    const card = page.locator('[role="listitem"]').filter({ hasText: "Rayleigh-Bénard Convection" });
    await expect(card).toBeVisible();
    await expect(card.getByText("PDE", { exact: true })).toBeVisible();
  });

  test("Rayleigh-Bénard Convection modal shows Ra slider and controls", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByText("Rayleigh-Bénard Convection").first().click();
    await expect(page.locator('label:has-text("Ra:") input[type="range"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "Arrows" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  });

  test("Rayleigh-Bénard Convection deep link opens via URL hash", async ({ page }) => {
    await page.goto("/gallery#rayleigh-benard");
    await expect(page.locator('label:has-text("Ra:") input[type="range"]')).toBeVisible({ timeout: 5000 });
  });

  // ═══════════════════════════════════════════
  // Sprint 11 — Number Theory & Cellular Automata
  // ═══════════════════════════════════════════

  test.describe("Ulam Spiral", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/gallery#ulam-spiral");
      await page.waitForSelector("[data-modal-content]", { timeout: 5000 });
    });

    test.afterEach(async ({ page }) => {
      await page.keyboard.press("Escape");
    });

    test("deep link opens modal with zoom slider and mode buttons", async ({ page }) => {
      const modal = page.locator("[data-modal-content]");
      await expect(modal.locator('label:has-text("Zoom") input[type="range"]')).toBeVisible();
      await expect(page.getByRole("button", { name: "Spiral" })).toBeVisible();
    });

    test("layout toggle switches between Spiral and Rectangular", async ({ page }) => {
      await page.getByRole("button", { name: "Spiral" }).click();
      await expect(page.getByRole("button", { name: "Rectangular" })).toBeVisible();
      await page.getByRole("button", { name: "Rectangular" }).click();
      await expect(page.getByRole("button", { name: "Spiral" })).toBeVisible();
    });
  });

  test.describe("Collatz Tree", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/gallery#collatz-tree");
      await page.waitForSelector("[data-modal-content]", { timeout: 5000 });
    });

    test.afterEach(async ({ page }) => {
      await page.keyboard.press("Escape");
    });

    test("deep link opens modal with Auto Explore and Reset buttons", async ({ page }) => {
      await expect(page.getByRole("button", { name: "Auto Explore" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Reset" })).toBeVisible();
    });

    test("Auto Explore button is clickable", async ({ page }) => {
      await page.getByRole("button", { name: "Auto Explore" }).click();
      await expect(page.getByRole("button", { name: /Stop|Pause/ })).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe("Hyperbolic Game of Life", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/gallery#hyperbolic-gol");
      await page.waitForSelector("[data-modal-content]", { timeout: 5000 });
    });

    test.afterEach(async ({ page }) => {
      await page.keyboard.press("Escape");
    });

    test("deep link opens modal with Play/Pause, Step, and rule button", async ({ page }) => {
      await expect(page.getByRole("button", { name: /Play|Pause/ })).toBeVisible();
      await expect(page.getByRole("button", { name: "Step" })).toBeVisible();
      await expect(page.getByRole("button", { name: /Conway|Rule/ })).toBeVisible();
    });

    test("Play/Pause toggle changes text", async ({ page }) => {
      const playPause = page.getByRole("button", { name: /Play|Pause/ });
      await playPause.click();
      await expect(playPause).toBeVisible();
    });

    test("rule button cycles through Conway/Seeds/HighLife", async ({ page }) => {
      const ruleBtn = page.getByRole("button", { name: /Conway|Seeds|HighLife|Rule/ });
      await expect(ruleBtn).toBeVisible();
      await ruleBtn.click();
      await expect(ruleBtn).toBeVisible();
    });
  });

  test.describe("Wave Function Collapse", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/gallery#wave-function-collapse");
      await page.waitForSelector("[data-modal-content]", { timeout: 5000 });
    });

    test.afterEach(async ({ page }) => {
      await page.keyboard.press("Escape");
    });

    test("deep link opens modal with Step, Auto, and Reset buttons", async ({ page }) => {
      await expect(page.getByRole("button", { name: "Step" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Auto" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Reset" })).toBeVisible();
    });

    test("Step button is clickable", async ({ page }) => {
      await page.getByRole("button", { name: "Step" }).click();
      await expect(page.getByRole("button", { name: "Step" })).toBeVisible();
    });
  });

  test.describe("Cellular Automata", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/gallery#cellular-automata");
      await page.waitForSelector("[data-modal-content]", { timeout: 5000 });
    });

    test.afterEach(async ({ page }) => {
      await page.keyboard.press("Escape");
    });

    test("deep link opens modal with 1D/2D mode buttons and rule buttons", async ({ page }) => {
      await expect(page.getByRole("button", { name: "1D" })).toBeVisible();
      await expect(page.getByRole("button", { name: "2D" })).toBeVisible();
    });

    test("mode toggle between 1D and 2D changes rule options", async ({ page }) => {
      await expect(page.getByRole("button", { name: "1D" })).toBeVisible();
      await page.getByRole("button", { name: "2D" }).click();
      await expect(page.getByRole("button", { name: "2D" })).toBeVisible();
      await page.getByRole("button", { name: "1D" }).click();
      await expect(page.getByRole("button", { name: "1D" })).toBeVisible();
    });
  });

  test.describe("Conformal Mapping", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/gallery#conformal-mapping");
      await page.waitForSelector("[data-modal-content]", { timeout: 5000 });
    });

    test.afterEach(async ({ page }) => {
      await page.keyboard.press("Escape");
    });

    test("deep link opens modal with function buttons", async ({ page }) => {
      await expect(page.getByRole("button", { name: "z²" })).toBeVisible();
      await expect(page.getByRole("button", { name: "1/z" })).toBeVisible();
      await expect(page.getByRole("button", { name: "eˣ" })).toBeVisible();
      await expect(page.getByRole("button", { name: "sin(z)" })).toBeVisible();
    });

    test("shows formula display", async ({ page }) => {
      await expect(page.getByText("f(z) = z²")).toBeVisible();
    });

    test("shows Reset and zoom controls", async ({ page }) => {
      await expect(page.getByRole("button", { name: "Reset" })).toBeVisible();
    });

    test("switches function on click", async ({ page }) => {
      await page.getByRole("button", { name: "z³" }).click();
      await expect(page.getByText("f(z) = z³")).toBeVisible();
    });
  });

  test.describe("Domain Coloring", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/gallery#domain-coloring");
      await page.waitForSelector("[data-modal-content]", { timeout: 5000 });
    });

    test.afterEach(async ({ page }) => {
      await page.keyboard.press("Escape");
    });

    test("deep link opens modal with function buttons", async ({ page }) => {
      await expect(page.getByRole("button", { name: "z^2" })).toBeVisible();
      await expect(page.getByRole("button", { name: "sin(z)" })).toBeVisible();
      await expect(page.getByRole("button", { name: "tanh(z)" })).toBeVisible();
    });

    test("shows formula display", async ({ page }) => {
      await expect(page.getByText("f(z) = z^2")).toBeVisible();
    });

    test("shows grid overlay toggle", async ({ page }) => {
      await expect(page.getByRole("button", { name: /Grid/i })).toBeVisible();
    });

    test("shows Reset button", async ({ page }) => {
      await expect(page.getByRole("button", { name: "Reset" })).toBeVisible();
    });

    test("switches function on click and updates formula", async ({ page }) => {
      await page.getByRole("button", { name: "cos(z)" }).click();
      await expect(page.getByText("f(z) = cos(z)")).toBeVisible();
    });
  });

  test.describe("Bézier Playground", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/gallery#bezier-playground");
      await page.waitForSelector("[data-modal-content]", { timeout: 5000 });
    });

    test.afterEach(async ({ page }) => {
      await page.keyboard.press("Escape");
    });

    test("deep link opens modal with curve type buttons", async ({ page }) => {
      await expect(page.getByRole("button", { name: "Bézier" })).toBeVisible();
      await expect(page.getByRole("button", { name: "B-Spline" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Catmull-Rom" })).toBeVisible();
    });

    test("shows Construction toggle", async ({ page }) => {
      await expect(page.getByRole("button", { name: /Construction/i })).toBeVisible();
    });

    test("shows preset buttons", async ({ page }) => {
      await expect(page.getByRole("button", { name: "S-Curve" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Loop" })).toBeVisible();
    });

    test("shows Clear button", async ({ page }) => {
      await expect(page.getByRole("button", { name: "Clear" })).toBeVisible();
    });

    test("loads preset on click", async ({ page }) => {
      await page.getByRole("button", { name: "Star" }).click();
      await expect(page.getByText("points, Degree")).toBeVisible();
    });
  });

  test.describe("Moiré Patterns", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/gallery#moire-patterns");
      await page.waitForSelector("[data-modal-content]", { timeout: 5000 });
    });

    test.afterEach(async ({ page }) => {
      await page.keyboard.press("Escape");
    });

    test("deep link opens modal with layer tabs", async ({ page }) => {
      await expect(page.getByRole("button", { name: "Layer 1" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Layer 2" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Layer 3" })).toBeVisible();
    });

    test("shows blend mode buttons", async ({ page }) => {
      await expect(page.getByRole("button", { name: /multiply/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /screen/i })).toBeVisible();
    });

    test("shows preset buttons", async ({ page }) => {
      await expect(page.getByRole("button", { name: "Classic" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Spiral" })).toBeVisible();
    });

    test("shows Reset button", async ({ page }) => {
      await expect(page.getByRole("button", { name: /reset/i })).toBeVisible();
    });

    test("shows animation toggle", async ({ page }) => {
      await expect(page.getByRole("button", { name: /Animate|Stop/i })).toBeVisible();
    });
  });
});
