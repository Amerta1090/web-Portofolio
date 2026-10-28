import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

// MOTION-05 — the Capability Map explains itself before a click.
//
//   M5.0  The two card columns start on the same line (the measured 1,236 px /
//         3,734-vs-2,498 px offset is gone) and the first project row is inside
//         the section's first viewport at 1440.
//   M5.1  A server-rendered default path names the capability the map opens on,
//         how many projects it connects to, and the strongest three — every value
//         derived from the graph, none typed into the copy.
//   M5.2  The entry fade draws those same edges first (`SignalLoom.entry.test.tsx`
//         pins the target order; this spec pins that the sentence and the map
//         agree on *which* edges those are).
//   M5.3  The narrative steps are real in-page anchors the island resolves, so a
//         click selects and announces the named project.
//   M5.4  Reduced motion keeps the identical default emphasis and drops the dots.
//
// Nothing below hard-codes a node id, a project title or a count: the map's own
// DOM (`data-default-node`, `data-edge-from/to/weight`, node order) supplies the
// expectation, so the spec survives the data growing.

const HOME = "/";

/** Hydration marker: exactly one card is in the tab order once the island runs. */
async function mapReady(page: Page) {
  await page.locator('[data-signal-node][tabindex="0"]').waitFor({ timeout: 20_000 });
}

/** Put the section's top edge at the viewport top without measuring the harness. */
async function alignSectionTop(page: Page) {
  await page.evaluate(() => {
    const section = document.querySelector("#systems-in-motion");
    if (!section) throw new Error("#systems-in-motion missing");
    const top = section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top, behavior: "instant" });
  });
}

interface MapModel {
  defaultId: string;
  nodes: string[];
  incident: { target: string; weight: number }[];
  expectedPath: string[];
}

/**
 * Read the drawn graph's model: the default node, its incident edges, and the
 * path they imply under the documented rule — heaviest overlap first, ties
 * resolved by graph (node) order, exactly what `defaultPathEdgeIds` does.
 */
async function readMap(page: Page): Promise<MapModel> {
  return page.evaluate(() => {
    const root = document.querySelector("[data-signal-loom]");
    const defaultId = root?.getAttribute("data-default-node") ?? "";
    const nodes = Array.from(document.querySelectorAll("[data-signal-node]")).map(
      (node) => node.getAttribute("data-signal-node") ?? "",
    );
    const edges = Array.from(document.querySelectorAll("[data-edge]")).map((edge) => ({
      from: edge.getAttribute("data-edge-from") ?? "",
      to: edge.getAttribute("data-edge-to") ?? "",
      weight: Number(edge.getAttribute("data-edge-weight") ?? "0"),
    }));
    const incident = edges
      .filter((edge) => edge.from === defaultId || edge.to === defaultId)
      .map((edge) => ({
        target: edge.from === defaultId ? edge.to : edge.from,
        weight: edge.weight,
      }));
    const expectedPath = incident
      .slice()
      .sort((a, b) => b.weight - a.weight || nodes.indexOf(a.target) - nodes.indexOf(b.target))
      .slice(0, 3)
      .map((edge) => `#signal-${edge.target}`);
    return { defaultId, nodes, incident, expectedPath };
  });
}

test.describe("MOTION-05 — the map explains itself without JavaScript", () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });

  test("the default path is in the server render, and its steps are real anchors (M5.1)", async ({
    page,
  }) => {
    await page.goto(HOME);

    const narrative = page.locator("[data-signal-narrative]");
    await expect(narrative).toBeVisible();
    await expect(narrative).toContainText("Default path");

    // The capability it names must be the card the map opens on, and the copy
    // must report the number of edges that card actually has. With scripts off
    // there are no connector lines to count, so this test pins the labels only —
    // the count is verified against the measured map in the hydrated test below.
    const defaultId = await page
      .locator("[data-signal-loom]")
      .first()
      .getAttribute("data-default-node");
    expect(defaultId).toBeTruthy();
    const capability = (
      await page.locator("[data-signal-narrative-capability]").innerText()
    ).trim();
    expect(capability.length).toBeGreaterThan(0);
    await expect(page.locator(`[data-signal-node="${defaultId}"]`)).toContainText(capability);

    // Three steps, each an in-page anchor whose target exists on this page and
    // is a project card — the no-JS fallback must navigate to something true.
    const steps = page.locator("[data-signal-narrative-step]");
    await expect(steps).toHaveCount(3);
    const hrefs = await steps
      .locator("a")
      .evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? ""));
    expect(hrefs).toHaveLength(3);

    for (const href of hrefs) {
      expect(href).toMatch(/^#signal-project-/);
      const target = page.locator(`[id="${href.slice(1)}"]`);
      await expect(target, `${href} must resolve to a node anchor`).toHaveCount(1);
      await expect(target.locator("[data-signal-node]")).toHaveAttribute(
        "data-node-kind",
        "project",
      );
    }

    // And it is genuinely readable prose, not an empty shell: the sentence names
    // a project count taken from the graph.
    await expect(narrative).toContainText(/connects to \d+ projects/);
  });
});

test.describe("MOTION-05 — the narrative matches the drawn map", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the copy's count and the three strongest ties come from the graph (M5.1)", async ({
    page,
  }) => {
    await page.goto(HOME);
    await page.locator("#systems-in-motion").scrollIntoViewIfNeeded();
    await mapReady(page);
    await page.locator("[data-edge]").first().waitFor({ timeout: 20_000 });

    const map = await readMap(page);
    // The default hub must be a capability with more edges than the list shows,
    // otherwise "3 strongest" would describe the whole set and prove nothing.
    expect(map.incident.length).toBeGreaterThan(3);
    await expect(page.locator(`[data-signal-node="${map.defaultId}"]`)).toHaveAttribute(
      "data-node-kind",
      "capability",
    );

    // The number in the sentence is the number of lines drawn from that card.
    await expect(page.locator("[data-signal-narrative]")).toContainText(
      `connects to ${map.incident.length} projects`,
    );

    // The listed steps are exactly the first three of the derived path, in the
    // same order — heaviest overlap first. The first three of 9 real ties all
    // carry the maximum weight, which is what "strongest" claims.
    const listed = await page
      .locator("[data-signal-narrative-step] a")
      .evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? ""));
    expect(listed).toEqual(map.expectedPath);
    const weightOf = (href: string) =>
      map.incident.find((edge) => `#signal-${edge.target}` === href)?.weight ?? 0;
    const weights = map.expectedPath.map(weightOf);
    expect(weights).toEqual([...weights].sort((a, b) => b - a));
  });

  test("a narrative step selects and announces the project it names (M5.3)", async ({ page }) => {
    await page.goto(HOME);
    await page.locator("#systems-in-motion").scrollIntoViewIfNeeded();
    await mapReady(page);

    const firstStep = page.locator("[data-signal-narrative-step] a").first();
    const href = (await firstStep.getAttribute("href")) as string;
    const nodeId = href.slice("#signal-".length);

    // The plain load selects the hub, so this click is a genuine change.
    await expect(page.locator("[data-signal-node][aria-current='true']")).not.toHaveAttribute(
      "data-signal-node",
      nodeId,
    );
    // The whole summary, not a prefix: the live region echoes this exact string
    // (`.opencode/probe-t05-status.mjs` measured status === summary), so a slice
    // would test the slice instead of the announcement.
    const summary = (
      await page.locator(`[id="${href.slice(1)}"] [data-node-summary]`).innerText()
    ).trim();
    expect(summary.length).toBeGreaterThan(0);

    await firstStep.scrollIntoViewIfNeeded();
    await firstStep.click();

    await expect(page.locator("[data-signal-node][aria-current='true']")).toHaveAttribute(
      "data-signal-node",
      nodeId,
    );
    await expect(page.locator("[data-signal-node][aria-current='true']")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    // The live region follows the selection — the anchor is not a decorative jump.
    await expect(page.locator("[data-signal-status-text]")).toHaveText(summary);
  });

  test("reduced motion keeps the same default emphasis with no travelling dots (M5.4)", async ({
    page,
  }) => {
    // `test.use({ reducedMotion })` is silently ignored by this Playwright
    // version (Q4.2), so the preference is set on the page and verified.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(HOME);
    expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(
      true,
    );
    await page.locator("#systems-in-motion").scrollIntoViewIfNeeded();
    await mapReady(page);

    const map = await readMap(page);
    const narrative = page.locator("[data-signal-narrative]");
    await expect(narrative).toBeVisible();
    await expect(page.locator("[data-signal-narrative-step]")).toHaveCount(3);

    // Static map, same selection: the narrative's capability is the selected
    // card, and no signal dot animates.
    const capability = (
      await page.locator("[data-signal-narrative-capability]").innerText()
    ).trim();
    await expect(page.locator(`[data-signal-node="${map.defaultId}"]`)).toContainText(capability);
    await expect(page.locator("[data-signal-node][aria-current='true']")).toHaveAttribute(
      "data-signal-node",
      map.defaultId,
    );
    await expect(page.locator("[data-signal-dot]")).toHaveCount(0);
    // Connectors are still drawn at rest — reduced motion removes motion, not map.
    expect(map.incident.length).toBeGreaterThan(0);
  });
});

test.describe("MOTION-05 — layout budgets", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("both columns start on the same line and the first project row is in the first viewport (M5.0)", async ({
    page,
  }) => {
    await page.goto(HOME);
    await page.locator("#systems-in-motion").scrollIntoViewIfNeeded();
    await mapReady(page);
    await alignSectionTop(page);

    const layout = await page.evaluate(() => {
      const top = (selector: string) =>
        document.querySelector(selector)?.getBoundingClientRect().top ?? null;
      const firstCard = document.querySelector(
        '[aria-label="Project evidence nodes"] [data-signal-node]',
      );
      const rect = firstCard?.getBoundingClientRect();
      return {
        capability: top('[aria-label="Capability nodes"]'),
        project: top('[aria-label="Project evidence nodes"]'),
        cardBottom: rect ? rect.bottom : null,
        viewport: window.innerHeight,
      };
    });

    expect(layout.capability).not.toBeNull();
    expect(layout.project).not.toBeNull();
    // The measured defects were 3,734 px vs 2,498 px — a 1,236 px empty panel.
    // Zero offset is the honest assertion, not "less than".
    expect(Math.abs((layout.capability as number) - (layout.project as number))).toBeLessThan(1);
    // The reader sees the capability cards and real project evidence together.
    expect(layout.cardBottom).not.toBeNull();
    expect(layout.cardBottom as number).toBeLessThan(layout.viewport);
  });

  test("a phone gets the capability label and project evidence inside the first viewport (M5.0)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(HOME);
    await page.locator("#systems-in-motion").scrollIntoViewIfNeeded();
    await mapReady(page);
    await alignSectionTop(page);

    // Below `md` the two columns are deliberately stacked and the connector
    // plane is hidden (`hidden md:block`), so "both columns side by side" is not
    // achievable and would be a made-up gate. What a phone reader can get in the
    // first viewport is the narrative: the capability the map opens on plus the
    // three strongest project ties, which is exactly what M5.0/M5.1 promise.
    const budget = await page.evaluate(() => {
      const narrative = document.querySelector("[data-signal-narrative]");
      if (!narrative) return null;
      const r = narrative.getBoundingClientRect();
      return {
        top: r.top,
        bottom: r.bottom,
        viewport: window.innerHeight,
        steps: document.querySelectorAll("[data-signal-narrative-step]").length,
        label: document.querySelector("[data-signal-narrative-capability]")?.textContent ?? "",
      };
    });
    if (!budget) throw new Error("narrative block missing at 375");
    expect(budget.steps).toBe(3);
    expect(budget.label.trim().length).toBeGreaterThan(0);
    expect(budget.top).toBeGreaterThanOrEqual(0);
    expect(budget.bottom).toBeLessThan(budget.viewport);
  });
});
