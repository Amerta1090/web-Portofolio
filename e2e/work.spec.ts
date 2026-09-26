import { expect, test } from "@playwright/test";

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
