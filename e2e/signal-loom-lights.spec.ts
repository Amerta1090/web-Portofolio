import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

// MOTION-21 — the signature moment (D-15): "the map lights".
//
// On entry every edge draws at rest; then light runs out along each edge of the
// selection, strongest tie first, and every neighbour card lights as its run
// lands. The second beat, "the room lights", lifts a dark wash off each flagship
// exhibit on the card's own view timeline.
//
// Every expectation below is derived from the rendered graph (edges, weights,
// node order) or from the server narrative — never typed in — so a data change
// moves the test with it.

const HOME = "/";

interface Model {
  selectedId: string;
  nodes: string[];
  /** Neighbours of the selection in run order: weight desc, then node order. */
  expected: string[];
}

async function openLitMap(page: Page) {
  await page.goto(HOME);
  await page.locator("#systems-in-motion").scrollIntoViewIfNeeded();
  await page.locator('[data-signal-node][tabindex="0"]').waitFor({ timeout: 20_000 });
  await page.locator("[data-signal-ready='true']").waitFor({ timeout: 20_000 });
}

async function readModel(page: Page): Promise<Model> {
  return page.evaluate(() => {
    const selectedId =
      document
        .querySelector("[data-signal-node][aria-current='true']")
        ?.getAttribute("data-signal-node") ?? "";
    const nodes = Array.from(document.querySelectorAll("[data-signal-node]")).map(
      (node) => node.getAttribute("data-signal-node") ?? "",
    );
    const incident = Array.from(document.querySelectorAll("[data-edge]"))
      .map((edge) => ({
        from: edge.getAttribute("data-edge-from") ?? "",
        to: edge.getAttribute("data-edge-to") ?? "",
        weight: Number(edge.getAttribute("data-edge-weight") ?? "0"),
      }))
      .filter((edge) => edge.from === selectedId || edge.to === selectedId)
      .map((edge) => ({
        target: edge.from === selectedId ? edge.to : edge.from,
        weight: edge.weight,
      }));
    const expected = incident
      .sort((a, b) => b.weight - a.weight || nodes.indexOf(a.target) - nodes.indexOf(b.target))
      .map((edge) => edge.target);
    return { selectedId, nodes, expected };
  });
}

/** Lit card ids ordered by their CSS arrival delay (the order they light). */
async function litByArrival(page: Page): Promise<{ id: string; delay: number }[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>("[data-signal-lit='true']"))
      .map((node) => ({
        id: node.getAttribute("data-signal-node") ?? "",
        delay: Number.parseFloat(
          node.querySelector<HTMLElement>("[data-signal-glow]")?.style.transitionDelay || "0",
        ),
      }))
      .sort((a, b) => a.delay - b.delay),
  );
}

test.describe("MOTION-21 — the map lights", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the entry draws the map dark first, then the selection lights its evidence in strength order", async ({
    page,
  }) => {
    // Record the first frame in which the edges exist: the light must not be on
    // yet (the entry is armed), or the moment would be a fade, not a lighting.
    await page.addInitScript(() => {
      const w = window as unknown as { __firstDrawn?: { edges: number; lit: number } };
      const observer = new MutationObserver(() => {
        const edges = document.querySelectorAll("#systems-in-motion [data-edge]").length;
        if (edges > 0 && !w.__firstDrawn) {
          w.__firstDrawn = {
            edges,
            lit: document.querySelectorAll("#systems-in-motion [data-signal-lit='true']").length,
          };
          observer.disconnect();
        }
      });
      document.addEventListener("DOMContentLoaded", () =>
        observer.observe(document.body, { subtree: true, childList: true }),
      );
    });
    await openLitMap(page);

    const first = await page.evaluate(
      () => (window as unknown as { __firstDrawn?: { edges: number; lit: number } }).__firstDrawn,
    );
    expect(first?.edges).toBeGreaterThan(0);
    expect(first?.lit).toBe(0);

    const model = await readModel(page);
    expect(model.expected.length).toBeGreaterThan(0);
    // One light run per edge of the selection — uncapped.
    await expect(page.locator("[data-signal-run]")).toHaveCount(model.expected.length);
    // The cards light in the order the runs land: strongest tie first.
    const lit = await litByArrival(page);
    expect(lit.map((entry) => entry.id)).toEqual(model.expected);
    for (let index = 1; index < lit.length; index += 1) {
      expect(lit[index].delay).toBeGreaterThan(lit[index - 1].delay);
    }

    // Settled: every lit card's glow is fully on, every dark card's is off.
    await page.waitForTimeout(Math.ceil((lit.at(-1)?.delay ?? 0) * 1000) + 600);
    const glow = await page.evaluate(() => {
      const opacity = (selector: string) =>
        Array.from(document.querySelectorAll(selector)).map((card) =>
          Number(getComputedStyle(card.querySelector("[data-signal-glow]") as Element).opacity),
        );
      return {
        lit: opacity("[data-signal-lit='true']"),
        dark: opacity("[data-signal-node]:not([data-signal-lit]):not([aria-current='true'])"),
      };
    });
    expect(glow.lit.every((value) => value === 1)).toBe(true);
    expect(glow.dark.length).toBeGreaterThan(0);
    expect(glow.dark.every((value) => value === 0)).toBe(true);
  });

  test("a new selection moves the light: its runs, its neighbours, the old ones dim", async ({
    page,
  }) => {
    await openLitMap(page);
    const before = await readModel(page);
    // The last capability card: a different hub with a different neighbourhood.
    const target = page.locator("[data-signal-node][data-node-kind='capability']").last();
    const targetId = (await target.getAttribute("data-signal-node")) ?? "";
    expect(targetId).not.toBe(before.selectedId);
    await target.click();
    await expect(page.locator(`[data-signal-node="${targetId}"]`)).toHaveAttribute(
      "aria-current",
      "true",
    );

    const after = await readModel(page);
    await expect(page.locator("[data-signal-run]")).toHaveCount(after.expected.length);
    const lit = await litByArrival(page);
    expect(lit.map((entry) => entry.id)).toEqual(after.expected);
    const dimmed = before.expected.filter((id) => !after.expected.includes(id));
    for (const id of dimmed) {
      await expect(page.locator(`[data-signal-node="${id}"]`)).not.toHaveAttribute(
        "data-signal-lit",
        "true",
      );
    }
  });

  test("reduced motion lights the same cards at once, with no run and no delay", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openLitMap(page);
    // Positive control: the preference actually reached the page.
    expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(
      true,
    );

    const model = await readModel(page);
    await expect(page.locator("[data-signal-run]")).toHaveCount(0);
    const lit = await litByArrival(page);
    expect(lit.map((entry) => entry.id).sort()).toEqual([...model.expected].sort());
    expect(lit.every((entry) => entry.delay === 0)).toBe(true);
    // `motion-reduce:transition-none` is `transition-property: none` — the glow
    // switches on without interpolating anything.
    const property = await page.evaluate(
      ([id]) =>
        getComputedStyle(
          document.querySelector(`[data-signal-node="${id}"] [data-signal-glow]`) as Element,
        ).transitionProperty,
      [lit[0].id],
    );
    expect(property).toBe("none");
  });
});

test.describe("MOTION-21 — the still without JavaScript", () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });

  test("the server render already lights the default capability's projects", async ({ page }) => {
    await page.goto(HOME);
    // The narrative states the count from the same graph: "connects to N projects".
    const sentence = await page.locator("[data-signal-narrative]").innerText();
    const connected = Number(/connects to (\d+) projects/.exec(sentence)?.[1] ?? "NaN");
    expect(connected).toBeGreaterThan(0);
    await expect(page.locator("[data-signal-lit='true']")).toHaveCount(connected);
    await expect(page.locator("[data-signal-run]")).toHaveCount(0);
  });
});

test.describe("MOTION-21 — the room lights", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the active flagship exhibit is lit on entry and reduced motion removes transition", async ({
    page,
  }) => {
    await page.goto(HOME);
    const first = page.locator("#projects [data-flagship-exhibit='0']");
    await expect(first).toHaveClass(/is-on/);

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(HOME);
    expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(
      true,
    );
    const transition = await first.evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(transition).toBe("0s");
  });
});
