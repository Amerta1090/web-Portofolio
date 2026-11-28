import { type Page, expect, test } from "@playwright/test";
import { LAB_EXPERIMENTS } from "../src/lib/lab-registry";
import { openExperiment, waitForExperimentReady } from "./hydration";

/**
 * Lab gallery + per-experiment smoke tests.
 *
 * Every experiment row is ONE test: a cold deep link (`/lab#<id>`, which also
 * proves hash launch), then its controls, then its interactions, all in the same
 * page. The previous layout paid one page load per assertion (102 tests across
 * gallery/game-theory/astrophysics specs) for the same coverage.
 *
 * The card-open helper is the shared one in `./hydration`: `GalleryGrid` is
 * `client:load` (a click before React attaches is dropped) and each experiment is
 * a `React.lazy` chunk behind `Suspense` (`waitForExperimentReady`). Cold deep
 * links measured 4.5–5.7 s on this box, so the readiness budget is 15 s.
 */

const modal = (page: Page) => page.locator("[data-modal-content]");
const button = (page: Page, name: string | RegExp) => page.getByRole("button", { name });
const slider = (page: Page, label: string) =>
  modal(page).locator(`label:has-text("${label}") input[type="range"]`);

async function visible(page: Page, ...buttons: Array<string | RegExp>) {
  for (const name of buttons) await expect(button(page, name)).toBeVisible();
}

interface Row {
  id: string;
  check: (page: Page) => Promise<void>;
}

const EXPERIMENTS: Row[] = [
  {
    id: "interactive-canvas",
    check: async (page) => {
      for (const title of ["Pen (P)", "Eraser (E)", "Node (N)", "Pan (V)"]) {
        await expect(page.getByTitle(title)).toBeVisible();
      }
      await visible(page, "PNG", "SVG", "↶ Undo", "↷ Redo", "🗑 Clear");
      await page.getByTitle("Eraser (E)").click();
      await page.getByTitle("Node (N)").click();
      await expect(page.getByTitle("Node (N)")).toBeVisible();
    },
  },
  {
    id: "strange-attractor",
    check: async (page) => {
      await visible(page, "Lorenz", "Rössler", "Reset", "Chaos Mode");
      await button(page, "Rössler").click();
      await expect(button(page, "Rössler")).toBeVisible();
    },
  },
  {
    id: "logistic-map",
    check: async (page) => {
      await visible(page, "Cobweb", "Auto Sweep");
      await button(page, "Cobweb").click();
      const r = page.locator('label:has-text("r") input[type="range"]');
      await r.fill("3.8");
      expect(Number(await r.inputValue())).toBe(3.8);
    },
  },
  {
    id: "noise-topography",
    check: async (page) => {
      await visible(page, "Export STL", "Auto");
      for (const label of ["Oct", "Pers", "Lac"]) await expect(slider(page, label)).toBeVisible();
      await page.getByText("✦ Auto").click();
      await expect(page.getByText("◉ Manual")).toBeVisible();
      const seed = slider(page, "Seed");
      await seed.fill("42");
      expect(Number(await seed.inputValue())).toBe(42);
    },
  },
  {
    id: "fourier-epicycles",
    check: async (page) => {
      await expect(page.getByText("Draw a closed shape")).toBeVisible();
      await page.getByText("Epicycles →").click();
      await expect(page.getByText("← Draw")).toBeVisible();
    },
  },
  {
    id: "svd-compression",
    check: async (page) => {
      await expect(page.getByText("Upload Image")).toBeVisible();
      await visible(page, "Reset");
    },
  },
  {
    id: "tesseract-projection",
    check: async (page) => {
      await expect(page.getByText("Auto", { exact: true })).toBeVisible();
      await visible(page, "Wireframe", "Faces");
    },
  },
  {
    id: "pca-tsne-viz",
    check: async (page) => {
      await expect(page.getByText("Generate New Data")).toBeVisible();
      await expect(page.getByText("Perplexity:")).toBeVisible();
    },
  },
  {
    id: "spring-physics",
    check: (page) => visible(page, "Cloth", "Chain", "Jelly", "Ragdoll"),
  },
  {
    id: "ulam-spiral",
    check: async (page) => {
      await expect(slider(page, "Zoom")).toBeVisible();
      await button(page, "Spiral").click();
      await button(page, "Rectangular").click();
      await expect(button(page, "Spiral")).toBeVisible();
    },
  },
  {
    id: "hyperbolic-gol",
    check: async (page) => {
      await visible(page, /Play|Pause/, "Step", /Conway|Rule/);
      await button(page, /Play|Pause/).click();
      const rule = button(page, /Conway|Seeds|HighLife|Rule/);
      await rule.click();
      await expect(rule).toBeVisible();
    },
  },
  {
    id: "conformal-mapping",
    check: async (page) => {
      await visible(page, "z²", "1/z", "eˣ", "sin(z)", "Reset");
      await expect(page.getByText("f(z) = z²")).toBeVisible();
      await button(page, "z³").click();
      await expect(page.getByText("f(z) = z³")).toBeVisible();
    },
  },
  {
    id: "bezier-playground",
    check: async (page) => {
      await visible(
        page,
        "Bézier",
        "B-Spline",
        "Catmull-Rom",
        /Construction/i,
        "S-Curve",
        "Loop",
        "Clear",
      );
      await button(page, "Star").click();
      await expect(page.getByText("points, Degree")).toBeVisible();
    },
  },
  {
    id: "nn-art",
    check: async (page) => {
      await expect(modal(page).locator("canvas")).toBeVisible();
      await visible(page, /Pause|Resume/, /Reset/, "XOR", "CIRCLE", "SPIRAL");
    },
  },
  {
    id: "fractal-flame-sync",
    check: async (page) => {
      await expect(modal(page).locator("canvas")).toBeVisible();
      await visible(page, "Static", "Mic", "File", /Reset/, "heat", "cool", "rainbow");
    },
  },
  {
    id: "gradient-descent",
    check: async (page) => {
      await visible(page, "SGD", "Momentum", "Adam", "Reset", /Chaos/);
      await expect(modal(page).locator('input[type="range"]')).toBeVisible();
      await button(page, "Adam").click();
      await button(page, "Momentum").click();
      await expect(button(page, "Momentum")).toBeVisible();
    },
  },
  {
    id: "prisoners-dilemma",
    check: async (page) => {
      await visible(page, /Run|Pause/, "Reset", "Step");
      await expect(
        modal(page)
          .locator("button")
          .filter({ hasText: /Tit-fo|Grim|Always|Random|Pavlov/i })
          .first(),
      ).toBeVisible();
      await expect(slider(page, "Speed")).toBeVisible();
      await button(page, "Step").click();
      await expect(button(page, "Step")).toBeVisible();
    },
  },
  {
    id: "simulated-annealing-tsp",
    check: async (page) => {
      await visible(page, /Run|Pause/, "Step", "Reset", "10 Cities", "20 Cities", "Grid", "Circle");
      await expect(slider(page, "T₀")).toBeVisible();
      await expect(slider(page, "Cooling")).toBeVisible();
      await button(page, "20 Cities").click();
      await expect(button(page, "20 Cities")).toBeVisible();
    },
  },
  {
    id: "three-body-problem",
    check: async (page) => {
      const select = modal(page).locator("select");
      await expect(select).toHaveValue("figure8");
      const options = await select.locator("option").allTextContents();
      expect(options).toEqual(
        expect.arrayContaining(["Figure-8", "Lagrange L4/L5", "Broucke Orbit"]),
      );
      await visible(page, /Pause|Play/, /Reset/);
      await expect(modal(page).locator('input[type="range"]')).toBeVisible();
      for (const text of [/KE/, /PE/, /steps/])
        await expect(modal(page).getByText(text)).toBeVisible();
      await select.selectOption("broucke");
      await expect(select).toHaveValue("broucke");
      await select.selectOption("lagrange");
      await expect(select).toHaveValue("lagrange");
    },
  },
  {
    id: "relativistic-orbits",
    check: async (page) => {
      await visible(page, /Pause|Play/, /Reset/);
      await expect(slider(page, "Speed")).toBeVisible();
      for (const text of [/Rs/, /Rph/, /Δφ/])
        await expect(modal(page).getByText(text)).toBeVisible();
      await slider(page, "Mass").fill("100");
      await expect(modal(page).getByText("100")).toBeVisible();
    },
  },
  {
    id: "galaxy-formation",
    check: async (page) => {
      await visible(page, "Pause", "Reset");
      for (const label of ["Angular momentum", "Speed"])
        await expect(slider(page, label)).toBeVisible();
      for (const text of [/Particles:/, /Baryonic:/, /Age:/]) {
        await expect(modal(page).getByText(text)).toBeVisible();
      }
      await expect(
        modal(page)
          .getByText(/Dark matter:/)
          .last(),
      ).toBeVisible();
      await slider(page, "Dark matter").fill("0.8");
      await expect(modal(page).locator(".text-amber-400").first()).toContainText("80%");
    },
  },
];

test.describe("Gallery page", () => {
  test("renders one card per registry experiment, with its tags", async ({ page }) => {
    await page.goto("/lab");
    await expect(page.getByRole("heading", { name: "Creative Lab" })).toBeVisible();
    await expect(page.locator('[role="list"] > [role="listitem"]')).toHaveCount(
      LAB_EXPERIMENTS.length,
    );
    for (const exp of LAB_EXPERIMENTS) {
      const card = page.locator('[role="listitem"]').filter({ hasText: exp.title }).first();
      await expect(card, exp.id).toBeVisible();
      for (const tag of exp.tags)
        await expect(card.getByText(tag, { exact: true }).first()).toBeVisible();
    }
  });

  test("clicking Fractal Explorer opens it; modes, palette, sliders and Escape work", async ({
    page,
  }) => {
    await page.goto("/lab");
    await openExperiment(page, "Fractal Explorer");
    await visible(page, "Mandelbrot", "Julia", "Amber", "Bookmark", "Pan", "Zoom");
    const iter = page.locator('label:has-text("Iter") input[type="range"]');
    expect(Number(await iter.inputValue())).toBe(256);
    const shift = page.locator('label:has-text("Shift") input[type="range"]');
    await shift.fill("50");
    expect(Number(await shift.inputValue())).toBe(50);
    await button(page, "Fire").click();
    await button(page, "Julia").click();
    await expect(modal(page).getByText("Cx")).toBeVisible();
    await expect(modal(page).getByText("Cy", { exact: true })).toBeVisible();
    await button(page, "Morph").click();
    await expect(button(page, "Morph On")).toBeVisible();
    await expect(page.getByText("Speed")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(button(page, "Mandelbrot")).not.toBeVisible();
  });

  test("modal focus trap: initial focus on close, Tab cycles inside, Escape closes", async ({
    page,
  }) => {
    await page.goto("/lab");
    await openExperiment(page, "Fractal Explorer");
    const dialog = page.getByRole("dialog", { name: "Fractal Explorer" });
    await expect(dialog).toBeVisible();
    const firstClose = dialog.locator("button").first();
    await expect(firstClose).toBeFocused();
    const focusableCount = await dialog
      .locator(
        'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), [href]:not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])',
      )
      .count();
    for (let i = 0; i < focusableCount; i++) await page.keyboard.press("Tab");
    await expect(firstClose).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(modal(page)).toHaveCount(0);
  });

  test("deep link via URL hash opens Fractal Explorer", async ({ page }) => {
    await page.goto("/lab#fractal-explorer");
    await expect(button(page, "Mandelbrot")).toBeVisible({ timeout: 15000 });
  });

  for (const row of EXPERIMENTS) {
    test(`${row.id}: deep link, controls and interactions`, async ({ page }) => {
      await page.goto(`/lab#${row.id}`);
      await waitForExperimentReady(page);
      await row.check(page);
      await page.keyboard.press("Escape");
      await expect(modal(page)).not.toBeVisible();
    });
  }
});
