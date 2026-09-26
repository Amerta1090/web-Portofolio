import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

test.describe("Work listing page", () => {
  test("loads and displays case study cards", async ({ page }) => {
    await page.goto("/work");
    await expect(page.locator("h1")).toContainText("Work");
    const cards = page.locator('a[href^="/work/"]');
    await expect(cards).toHaveCount(2);
  });

  test("each card shows title, summary, role, and metrics", async ({ page }) => {
    await page.goto("/work");
    const firstCard = page.locator('a[href^="/work/"]').first();
    await expect(firstCard).toBeVisible();
    await expect(firstCard.locator("h2")).not.toBeEmpty();
    await expect(firstCard.locator("p").first()).not.toBeEmpty();
  });

  test("clicking a card navigates to detail page", async ({ page }) => {
    await page.goto("/work");
    const firstCard = page.locator('a[href^="/work/"]').first();
    const href = await firstCard.getAttribute("href");
    await firstCard.click();
    await expect(page).toHaveURL(new RegExp(`^.*${href}$`));
  });
});

test.describe("Work detail page", () => {
  test("shows title, summary, metrics, and stack tags", async ({ page }) => {
    await page.goto("/work/ai-quranic-tafsir");
    await expect(page.locator("h1")).toContainText("AI Quranic Tafsir");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator(".text-brand").first()).toBeVisible();
    await expect(page.locator("text=Python")).toBeVisible();
  });

  test("renders body content sections", async ({ page }) => {
    await page.goto("/work/ai-quranic-tafsir");
    await expect(page.locator(".case-study-content h2:has-text('Problem')")).toBeVisible();
    await expect(page.locator(".case-study-content h2:has-text('Approach')")).toBeVisible();
    await expect(page.locator(".case-study-content h2:has-text('Key Decisions')")).toBeVisible();
    await expect(page.locator(".case-study-content h2:has-text('Outcome')")).toBeVisible();
  });

  test("back link navigates to work listing", async ({ page }) => {
    await page.goto("/work/ai-quranic-tafsir");
    const backLink = page.locator('a[href="/work"]');
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL(/\/work\/?$/);
  });
});

test.describe("Case Study Reactor content model", () => {
  test("renders the stages as one ordered sequence", async ({ page }) => {
    await page.goto("/work/ai-quranic-tafsir");
    const stages = page.locator("[data-reactor-stage]");
    await expect(stages).toHaveCount(5);

    const ids = await stages.evaluateAll((els) =>
      els.map((el) => el.getAttribute("data-reactor-stage")),
    );
    expect(ids).toEqual(["problem", "data", "model", "system", "impact"]);

    // Ordered sequence semantics, not a pile of divs.
    await expect(page.locator("#process ol > li[data-reactor-stage]")).toHaveCount(5);
  });

  test("each stage keeps its heading, evidence, metric, and deep link", async ({ page }) => {
    await page.goto("/work/ai-quranic-tafsir");
    const impact = page.locator('[data-reactor-stage="impact"]');

    await expect(impact.locator("h3")).toHaveText("Impact");
    await expect(impact.locator("p").first()).not.toBeEmpty();
    await expect(impact).toContainText("Context Relevance");
    await expect(impact).toContainText("0.972");
    await expect(impact.locator('a[href="#stage-impact"]')).toBeVisible();

    // Deep-link target from the section header exists for every stage.
    for (const id of ["problem", "data", "model", "system", "impact"]) {
      await expect(page.locator(`#stage-${id}`)).toHaveCount(1);
    }
  });

  test("a case study without stages renders no reactor section", async ({ page }) => {
    await page.goto("/work/red-devil-dynamics");
    await expect(page.locator("#process")).toHaveCount(0);
    await expect(page.locator("[data-reactor-stage]")).toHaveCount(0);
    // The ordinary narrative is untouched.
    await expect(page.locator(".case-study-content h2:has-text('Problem')")).toBeVisible();
  });
});

test.describe("Case Study Reactor stage controls", () => {
  const process = "#process";

  async function openReactor(page: Page) {
    await page.goto("/work/ai-quranic-tafsir");
    const section = page.locator(process);
    await section.scrollIntoViewIfNeeded();
    // `client:visible` hydration is the only gate for the stepper.
    await expect(page.locator("[data-reactor-stepper]")).toBeVisible({ timeout: 10_000 });
    return section;
  }

  test("stage panel ships before hydration, stepper after", async ({ page }) => {
    await openReactor(page);
    await expect(page.locator("[data-reactor-diagram]")).toBeVisible();
    await expect(page.locator("[data-reactor-node]").first()).toBeVisible();
    await expect(page.locator("[data-reactor-step]")).toHaveCount(5);
    // First stage is current, and it owns the single tab stop.
    await expect(page.locator('[data-reactor-step="problem"]')).toHaveAttribute(
      "aria-current",
      "step",
    );
  });

  test("clicking a stage moves the visual stage and the list emphasis", async ({ page }) => {
    await openReactor(page);

    await page.locator('[data-reactor-step="model"]').click();

    await expect(page.locator("[data-reactor-stage-label]")).toHaveText("Model");
    await expect(page.locator("[data-reactor]")).toHaveAttribute("data-reactor-active", "model");
    await expect(page.locator('[data-reactor-step="model"]')).toHaveAttribute(
      "aria-current",
      "step",
    );
    await expect(page.locator('[data-reactor-step="problem"]')).not.toHaveAttribute(
      "aria-current",
      "step",
    );
    // The canonical list item for that stage is marked, the others are not.
    await expect(page.locator('#stage-model[data-reactor-active="true"]')).toHaveCount(1);
    await expect(page.locator('[data-reactor-stage][data-reactor-active="true"]')).toHaveCount(1);

    // Model stage diagram is the two-path fork: 5 boxes, 4 connectors.
    await expect(page.locator("[data-reactor-node]")).toHaveCount(5);
    await expect(page.locator("[data-reactor-edge]")).toHaveCount(4);
    await expect(page.locator("[data-reactor-metric]")).toContainText("LLaMA 3.2 3B");
    await expect(page.locator("[data-reactor-caption]")).toContainText("fused");

    // Deep link is updated without moving the page.
    await expect(page).toHaveURL(/#stage-model$/);
  });

  test("keyboard moves between stages and keeps one tab stop", async ({ page }) => {
    await openReactor(page);

    await page.locator('[data-reactor-step="problem"]').focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("[data-reactor-stage-label]")).toHaveText("Data");
    await expect(page.locator('[data-reactor-step="data"]')).toBeFocused();

    await page.keyboard.press("End");
    await expect(page.locator("[data-reactor-stage-label]")).toHaveText("Impact");

    const tabStops = page.locator('[data-reactor-step][tabindex="0"]');
    await expect(tabStops).toHaveCount(1);
  });

  test("a direct deep link opens that stage", async ({ page }) => {
    await page.goto("/work/ai-quranic-tafsir#stage-system");
    await page.locator(process).scrollIntoViewIfNeeded();
    await expect(page.locator("[data-reactor-stepper]")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("[data-reactor-stage-label]")).toHaveText("System");
    await expect(page.locator('[data-reactor-step="system"]')).toHaveAttribute(
      "aria-current",
      "step",
    );
    await expect(page.locator("#stage-system")).toHaveAttribute("data-reactor-active", "true");
    // System stage: four boxes, three connectors.
    await expect(page.locator("[data-reactor-node]")).toHaveCount(4);
    await expect(page.locator("[data-reactor-edge]")).toHaveCount(3);
  });

  test("stage anchors inside the list drive the same state", async ({ page }) => {
    await openReactor(page);
    await page.locator('#stage-impact a[href="#stage-impact"]').click();
    await expect(page.locator("[data-reactor-stage-label]")).toHaveText("Impact");
  });

  test("reduced motion renders the resting stage with no animation hook", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openReactor(page);
    await expect(page.locator("[data-reactor]")).not.toHaveAttribute(
      "data-reactor-animate",
      "true",
    );
    await expect(page.locator("[data-reactor-diagram]")).toBeVisible();
    await page.locator('[data-reactor-step="data"]').click();
    await expect(page.locator("[data-reactor-stage-label]")).toHaveText("Data");
  });

  test("a case study without stages mounts no reactor", async ({ page }) => {
    await page.goto("/work/red-devil-dynamics");
    await expect(page.locator("[data-reactor]")).toHaveCount(0);
  });
});
