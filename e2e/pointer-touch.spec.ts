import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

// F5.1 — the input modalities of two PRD Definition-of-Done lines that no test
// actually exercised.
//
//   Signal Loom:      "Selection works with pointer, touch, keyboard, and deep link."
//   Case Study Reactor: "Stage selection works with buttons, keyboard, touch, and deep links."
//
// Keyboard and deep links are pinned in accessibility.spec.ts and work.spec.ts, and
// pointer clicks on the reactor are pinned in work.spec.ts. Two modalities had zero
// coverage anywhere in the suite: a grep for `hasTouch` / `pointerType` / `tap(`
// returned nothing, and Signal Loom was only ever driven by `focus()` + arrow keys
// — never by a click or a hover. The DoD line was being claimed without evidence.
//
// Touch tests run in a real touch-enabled Chromium context and dispatch genuine touch
// input, not synthetic mouse clicks. Q4.2 lesson applied: `test.use()` context options
// were found to be silently ignored in this repo's Playwright version, so the touch
// describe first asserts that the emulation actually reached the page
// (`navigator.maxTouchPoints`) before trusting any interaction result.

const HOME = "/";
const CASE_STUDY = "/work/ai-quranic-tafsir";

/** WCAG 2.2 SC 2.5.8 Target Size (Minimum) is 24x24 CSS px. */
const MIN_TARGET_PX = 24;

async function openSignalLoom(page: Page) {
  await page.goto(HOME);
  await page.locator("#systems-in-motion").scrollIntoViewIfNeeded();
  await page.locator('[data-signal-node][tabindex="0"]').waitFor({ timeout: 20_000 });
  // The cards exist as soon as the island hydrates, but the connector lines do not:
  // their coordinates are measured from the real card layout, and that first read
  // is deliberately deferred by one animation frame so it does not interleave with
  // the hydration write. So "hydrated" and "graph drawn" are two different moments,
  // and every assertion below is about the second one. Without this wait, a
  // stroke-width assertion can read a graph that does not exist yet and pass or fail
  // for the wrong reason.
  await page.waitForFunction(
    () => (document.querySelectorAll("#systems-in-motion [data-edge]").length ?? 0) > 0,
    undefined,
    { timeout: 20_000 },
  );
}

async function openReactor(page: Page) {
  await page.goto(CASE_STUDY);
  await page.locator("#process").scrollIntoViewIfNeeded();
  await page.locator("[data-reactor-stepper]").waitFor({ timeout: 20_000 });
}

/**
 * One drawn edge: its declared skill-overlap weight and the stroke width the
 * island actually rendered from it.
 */
interface EdgeSample {
  id: string;
  weight: number;
  width: number;
}

type Emphasis = "rest" | "hover" | "active";

// A deliberate copy of `edgeStrokeWidth` from src/lib/creative/signal-loom.ts:
// an e2e spec cannot import a client module (Bun ESM refuses the repo's JSON
// imports — see e2e/certifications.spec.ts). The constants are mirrored, not the
// assertion: the spec still reads the real rendered `stroke-width`, so if the
// production mapping changes and this mirror does not, every width assertion
// below fails loudly. Keep the two in step.
const EDGE_WIDTH_BASE = 1.1;
const EDGE_WIDTH_STEP = 0.7;
const EDGE_EMPHASIS_LIFT: Record<Emphasis, number> = { rest: 0, hover: 0.5, active: 0.9 };
const expectedWidth = (weight: number, emphasis: Emphasis) => {
  const base = Number.isFinite(weight) && weight > 0 ? weight : 1;
  return (
    Math.round(
      (EDGE_WIDTH_BASE + (base - 1) * EDGE_WIDTH_STEP + EDGE_EMPHASIS_LIFT[emphasis]) * 10,
    ) / 10
  );
};

const edgeSamples = (page: Page): Promise<EdgeSample[]> =>
  page.locator("[data-edge]").evaluateAll((els) =>
    els.map((el) => ({
      id: el.getAttribute("data-edge") ?? "",
      weight: Number(el.getAttribute("data-edge-weight") ?? "0"),
      width: Number(el.getAttribute("stroke-width") ?? "0"),
    })),
  );

/**
 * Edges belonging to one node. Edge ids are `capabilityId->projectId`, so a
 * project card's own edges are the ones pointing at it. Scoped per node because
 * a whole-graph width tally cannot distinguish "this card is emphasised" from
 * "some other card is".
 */
const ownEdges = (samples: EdgeSample[], nodeId: string) =>
  samples.filter((sample) => sample.id.endsWith(`->${nodeId}`));

const countAt = (samples: EdgeSample[], emphasis: Emphasis) =>
  samples.filter((sample) => sample.width === expectedWidth(sample.weight, emphasis)).length;

const allAt = (samples: EdgeSample[], emphasis: Emphasis) =>
  samples.length > 0 &&
  samples.every((sample) => sample.width === expectedWidth(sample.weight, emphasis));

const selectedNode = (page: Page) =>
  page.locator("[data-signal-node][aria-current='true']").getAttribute("data-signal-node");

/**
 * A project card the current selection does not already reach.
 *
 * Not a nicety: the active emphasis (`strokeWidth` at the "active" lift) wins
 * over the hover shadow. Hovering a card the selection already connects
 * therefore changes nothing observable, so an assertion like "hovering produces
 * a hover-width edge" silently tests nothing on those cards. Deriving the target
 * from the rendered widths and weights states the precondition instead of
 * assuming it.
 */
async function unreachedProjectCard(page: Page, which: 0 | 1 = 0) {
  const samples = await edgeSamples(page);
  const selected = await selectedNode(page);
  const zone = page.getByRole("region", { name: "Project evidence nodes" });
  const ids = await zone
    .locator("[data-signal-node]")
    .evaluateAll((els) => els.map((el) => el.getAttribute("data-signal-node") as string));
  const free = ids.filter((id) => {
    if (id === selected) return false;
    const own = ownEdges(samples, id);
    return own.length > 0 && own.every((s) => s.width !== expectedWidth(s.weight, "active"));
  });
  const id = free[which];
  expect(id, "the portfolio graph must have a project the selection does not reach").toBeTruthy();
  return { id, card: zone.locator(`[data-signal-node="${id}"]`) };
}

/** Bounding boxes of the interactive cards, for the touch-target measurement. */
const targetSizes = (page: Page, selector: string) =>
  page.locator(selector).evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    }),
  );

test.describe("F5.1 — pointer input", () => {
  test.use({ hasTouch: false, viewport: { width: 1440, height: 900 } });

  test("a mouse click selects a Signal Loom card and explains it", async ({ page }) => {
    await openSignalLoom(page);
    const before = await selectedNode(page);

    const card = page
      .getByRole("region", { name: "Project evidence nodes" })
      .locator("[data-signal-node]")
      .nth(1);
    const target = (await card.getAttribute("data-signal-node")) as string;
    const summary = (await card.getAttribute("data-node-summary")) ?? "";

    await card.click();

    await expect(page.locator("[data-signal-node][aria-current='true']")).toHaveAttribute(
      "data-signal-node",
      target,
    );
    await expect(page.locator("[data-signal-status-text]")).toContainText(summary.slice(0, 40));
    expect(await selectedNode(page)).not.toBe(before);
    // Its incident edges are the emphasised ones, not merely the hovered ones.
    const own = ownEdges(await edgeSamples(page), target);
    expect(own.length).toBeGreaterThan(0);
    expect(allAt(own, "active")).toBe(true);
  });

  test("hovering a card traces its edges without selecting it", async ({ page }) => {
    await openSignalLoom(page);
    await expect(page.locator("#systems-in-motion svg")).toBeVisible();
    const before = await selectedNode(page);
    const { id, card } = await unreachedProjectCard(page);
    expect((await edgeSamples(page)).length).toBeGreaterThan(0);
    expect(countAt(await edgeSamples(page), "hover")).toBe(0);

    await card.hover();

    // Hover is emphasis, never selection: the reader can inspect a path without
    // changing what the live region is announcing.
    await expect.poll(async () => countAt(await edgeSamples(page), "hover")).toBeGreaterThan(0);
    expect(allAt(ownEdges(await edgeSamples(page), id), "hover")).toBe(true);
    expect(await selectedNode(page)).toBe(before);

    // And it is reversible: leaving the card clears the shadow.
    await page.locator("#systems-in-motion h2").first().hover();
    await expect.poll(async () => countAt(await edgeSamples(page), "hover")).toBe(0);
    expect(await selectedNode(page)).toBe(before);
  });

  test("a card the selection already reaches keeps its own emphasis while hovered", async ({
    page,
  }) => {
    // The counterpart of the test above, pinning the precedence rule it relies on.
    // A card the selection already connects shows the active width both before and
    // during hover: the active edge wins, so the hover shadow is not drawn on top.
    // Without this, a reader could read a missing hover shadow on those cards as a
    // broken interaction rather than a deliberate choice.
    await openSignalLoom(page);
    const selected = await selectedNode(page);
    const samples = await edgeSamples(page);
    // A card the selection reaches through *every* one of its edges. Stating the
    // precondition matters: the honest all-project graph (Task 3.1) gives projects
    // up to two edges, and hovering a partially-connected card correctly draws the
    // shadow on its untouched edge — so "no hover width anywhere" would be the wrong
    // expectation there. This test is about the fully-connected card.
    const nodeIds = await page
      .locator("[data-signal-node]")
      .evaluateAll((els) => els.map((el) => el.getAttribute("data-signal-node") as string));
    const connectedId = nodeIds.find((id) => {
      if (id === selected) return false;
      const own = ownEdges(samples, id);
      return own.length > 0 && allAt(own, "active");
    });
    expect(connectedId).toBeTruthy();

    const card = page.locator(`[data-signal-node="${connectedId}"]`);
    // Scoped to this card's own edges: a whole-graph tally could be satisfied by
    // the selection's edges and prove nothing about the card under test.
    const ownBefore = ownEdges(samples, connectedId as string);
    expect(ownBefore.length).toBeGreaterThan(0);
    expect(allAt(ownBefore, "active")).toBe(true);

    await card.hover();
    await page.waitForTimeout(200);

    expect(allAt(ownEdges(await edgeSamples(page), connectedId as string), "active")).toBe(true);
    expect(countAt(await edgeSamples(page), "hover")).toBe(0);
    expect(await selectedNode(page)).toBe(selected);
  });
});

test.describe("F5.1 — touch input", () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

  test("the context really is a touch device", async ({ page }) => {
    await page.goto(HOME);
    // Without this, every other test in the file could pass with mouse input.
    const touchPoints = await page.evaluate(() => navigator.maxTouchPoints);
    expect(touchPoints).toBeGreaterThan(0);
  });

  test("a tap selects a Signal Loom project card and explains it", async ({ page }) => {
    await openSignalLoom(page);

    const projectZone = page.getByRole("region", { name: "Project evidence nodes" });
    const card = projectZone.locator("[data-signal-node]").nth(1);
    const target = (await card.getAttribute("data-signal-node")) as string;
    const summary = (await card.getAttribute("data-node-summary")) ?? "";

    // Nothing is selected from this node's side yet.
    const before = await page
      .locator("[data-signal-node][aria-current='true']")
      .getAttribute("data-signal-node");

    await card.tap();

    // Selection moved, and the explanation is the tapped node's own summary — the
    // live region is the only place the full text is announced (the accessible
    // name is deliberately short, see Q4.2 D3).
    await expect(page.locator("[data-signal-node][aria-current='true']")).toHaveAttribute(
      "data-signal-node",
      target,
    );
    await expect(page.locator("[data-signal-status-text]")).toContainText(summary.slice(0, 40));
    const after = await page
      .locator("[data-signal-node][aria-current='true']")
      .getAttribute("data-signal-node");
    expect(after).not.toBe(before);
  });

  test("a tap never leaves a hover shadow behind", async ({ page }) => {
    // Tablet width on purpose: below `md` the connector plane is hidden, so a
    // shadow could not be observed at all.
    await page.setViewportSize({ width: 834, height: 1112 });
    await openSignalLoom(page);
    await expect(page.locator("#systems-in-motion svg")).toBeVisible();

    // Two cards the selection does not already reach, so their edges are free to
    // take the shadow width. (On a card the selection already reaches, the active
    // edge at the active lift always wins — see the precedence test in the pointer
    // block.)
    const first = await unreachedProjectCard(page, 0);
    const second = await unreachedProjectCard(page, 1);
    expect((await edgeSamples(page)).length).toBeGreaterThan(0);
    expect(countAt(await edgeSamples(page), "hover")).toBe(0);

    // Edge ids are `capabilityId->projectId`, so a card's own edges are the ones
    // pointing at it.
    expect(ownEdges(await edgeSamples(page), first.id).length).toBeGreaterThan(0);

    // Positive control, in this same touch context and at this same width: a real
    // hover on the first card does produce the shadow. Without it, the negative
    // assertion below would pass just as well if the shadow mechanism were broken.
    await first.card.hover();
    await expect.poll(async () => countAt(await edgeSamples(page), "hover")).toBeGreaterThan(0);
    await page.mouse.move(5, 5);
    await expect.poll(async () => countAt(await edgeSamples(page), "hover")).toBe(0);

    // The property under test: a tap fires pointerenter like a hover does, yet the
    // reader is left with a clean diagram — the tapped card reads as selected, and
    // nothing keeps a shadow once the selection moves on.
    await first.card.tap();
    await expect(page.locator("[data-signal-node][aria-current='true']")).toHaveAttribute(
      "data-signal-node",
      first.id,
    );
    expect(allAt(ownEdges(await edgeSamples(page), first.id), "active")).toBe(true);
    expect(countAt(await edgeSamples(page), "hover")).toBe(0);

    await second.card.tap();
    await expect(page.locator("[data-signal-node][aria-current='true']")).toHaveAttribute(
      "data-signal-node",
      second.id,
    );
    await expect
      .poll(async () => countAt(await edgeSamples(page), "hover"), { timeout: 5_000 })
      .toBe(0);
    expect(allAt(ownEdges(await edgeSamples(page), first.id), "rest")).toBe(true);

    // Note on what this does and does not prove. An earlier version of this test
    // claimed to catch a hover shadow "stuck" on a card the finger had left, and
    // it passed even with `onPointerLeave` deleted from the island. The state turns
    // out to be unreachable: every route that can change the selection after
    // hydration also re-enters the new node (a tap fires pointerenter) or moves
    // focus (arrow keys, which set and clear the same state), and the deep link is
    // read once at mount with no `hashchange` listener, so it cannot change the
    // selection later at all. So this test pins the observable outcome rather than
    // a hypothetical leak, and the mutation experiment is recorded in
    // docs/archive/creative-ui-animation-TASKS.md.
  });

  test("Signal Loom controls are large enough to hit with a finger", async ({ page }) => {
    await openSignalLoom(page);
    const sizes = await targetSizes(page, "[data-signal-node]");
    expect(sizes).toHaveLength(30);
    for (const size of sizes) {
      expect(size.w).toBeGreaterThanOrEqual(MIN_TARGET_PX);
      expect(size.h).toBeGreaterThanOrEqual(MIN_TARGET_PX);
    }
  });

  test("a tap advances the Case Study Reactor to that stage", async ({ page }) => {
    await openReactor(page);

    await expect(page.locator('[data-reactor-stage="problem"]')).toHaveAttribute(
      "data-reactor-active",
      "true",
    );
    // Document offset, not `window.scrollY`: `tap()` scrolls its target into view
    // by design, so a viewport scroll is the harness moving, not the page. A
    // layout-invariant coordinate is the only honest signal here (Q4.3 lesson 2).
    const listTopBefore = await page.evaluate(() => {
      const ol = document.querySelector("#process ol");
      return ol ? Math.round(ol.getBoundingClientRect().top + window.scrollY) : -1;
    });
    expect(listTopBefore).toBeGreaterThan(0);

    await page.locator('[data-reactor-step="model"]').tap();

    await expect(page.locator("[data-reactor-stage-label]")).toHaveText("Model");
    await expect(page.locator('[data-reactor-stage="model"]')).toHaveAttribute(
      "data-reactor-active",
      "true",
    );
    // The stage list is emphasis-only: the canonical document order never moves,
    // so a tap cannot push the reader's position around either.
    const ids = await page
      .locator("[data-reactor-stage]")
      .evaluateAll((els) => els.map((el) => el.getAttribute("data-reactor-stage")));
    expect(ids).toEqual(["problem", "data", "model", "system", "impact"]);

    // Tapping a step is not a navigation gesture: the reactor has no scroll
    // listener and no scroll hijack, so nothing on the page moved.
    const listTopAfter = await page.evaluate(() => {
      const ol = document.querySelector("#process ol");
      return ol ? Math.round(ol.getBoundingClientRect().top + window.scrollY) : -1;
    });
    expect(listTopAfter).toBe(listTopBefore);
  });

  test("reactor steps are large enough to hit with a finger", async ({ page }) => {
    await openReactor(page);
    const sizes = await targetSizes(page, "[data-reactor-step]");
    expect(sizes).toHaveLength(5);
    for (const size of sizes) {
      expect(size.w).toBeGreaterThanOrEqual(MIN_TARGET_PX);
      expect(size.h).toBeGreaterThanOrEqual(MIN_TARGET_PX);
    }
  });
});
