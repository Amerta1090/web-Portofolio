import { expect, test } from "@playwright/test";

/**
 * M4.7 — every SVG chart ships an sr-only data table with the same rows it
 * draws. Tables are SSR markup (islands server-render), so presence needs no
 * hydration. Same-data is pinned by comparing table rows against the chart's
 * own rendered nodes — no data-layer import needed (Bun ESM rejects repo
 * JSON imports; precedent T2.6).
 */
const rowsOf = (page: import("@playwright/test").Page, id: string) =>
  page.locator(`table[data-chart-table="${id}"] tbody tr`);

test.describe("Chart data tables — /observatory (M4.7)", () => {
  test("timeline table mirrors the SVG nodes (Project | Period | Category)", async ({ page }) => {
    await page.goto("/observatory");
    const table = page.locator('table[data-chart-table="timeline"]');
    await expect(table).toBeAttached();
    await expect(table.locator("thead th")).toContainText(["Project", "Period", "Category"]);
    const svgNodes = page.locator('section[aria-labelledby="obs-timeline"] svg g');
    await expect(rowsOf(page, "timeline")).toHaveCount(await svgNodes.count());
    // Same-data spot: every table project name is drawn as an SVG label.
    const firstProject = (await rowsOf(page, "timeline").first().locator("td").first().textContent())?.trim();
    expect(firstProject?.length).toBeGreaterThan(0);
    await expect(page.locator('section[aria-labelledby="obs-timeline"] svg')).toContainText(
      firstProject!.slice(0, 22),
    );
  });

  test("patterns table mirrors the SVG nodes (Skill | Projects)", async ({ page }) => {
    await page.goto("/observatory");
    const table = page.locator('table[data-chart-table="patterns"]');
    await expect(table).toBeAttached();
    await expect(table.locator("thead th")).toContainText(["Skill", "Projects"]);
    const svgNodes = page.locator('section[aria-labelledby="obs-patterns"] svg g');
    await expect(rowsOf(page, "patterns")).toHaveCount(await svgNodes.count());
  });
});

test.describe("Chart data tables — /github (M4.7)", () => {
  const tables = [
    "codedna-languages",
    "languages-radial",
    "weekly-activity",
    "contribution-weeks",
    "languages-nebula",
  ];

  for (const id of tables) {
    test(`${id}: table present with header + at least one data row`, async ({ page }) => {
      await page.goto("/github");
      const table = page.locator(`table[data-chart-table="${id}"]`);
      await expect(table).toBeAttached();
      expect(await table.locator("thead th").count()).toBeGreaterThanOrEqual(2);
      expect(await table.locator("tbody tr").count()).toBeGreaterThan(0);
    });
  }

  test("radial table matches the visible legend (same source array)", async ({ page }) => {
    await page.goto("/github");
    const firstCell = await rowsOf(page, "languages-radial").first().locator("td").first().textContent();
    expect(firstCell?.trim().length).toBeGreaterThan(0);
    // The legend next to the donut renders the same language names as text.
    await expect(page.getByText(firstCell!.trim(), { exact: true }).first()).toBeVisible();
  });

  test("network tables present when the D3 tier renders (tier-1 grid / tier-3 canvas have no SVG graph)", async ({
    page,
  }) => {
    await page.goto("/github");
    // SSR defaults to tier-3; the client settles the real tier on hydration.
    // Force-hydrate the galaxy phase before judging which tier rendered.
    const galaxy = page.locator('div[data-phase="galaxy"]');
    await galaxy.scrollIntoViewIfNeeded();
    await expect
      .poll(
        async () =>
          (await page.locator('table[data-chart-table="repo-network-nodes"]').count()) > 0 ||
          (await page.locator("canvas").count()) > 0,
        { timeout: 15000 },
      )
      .toBe(true);
    const nodes = page.locator('table[data-chart-table="repo-network-nodes"]');
    const links = page.locator('table[data-chart-table="repo-network-links"]');
    if ((await nodes.count()) === 0) {
      // Tier-1 static grid or tier-3 R3F canvas on this run: no SVG graph, no
      // tables by construction. Covered instead by the NetworkGraph unit test.
      expect(await links.count()).toBe(0);
      return;
    }
    expect(await nodes.locator("tbody tr").count()).toBeGreaterThan(0);
    expect(await links.locator("tbody tr").count()).toBeGreaterThan(0);
  });
});
