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

/**
 * L3.3 — responsive case study composition. The same two blocks (the stage
 * visual, the canonical ordered list) must compose three different ways:
 * pinned beside the list on wide screens, stacked in normal flow below `lg`.
 * These assertions are geometric on purpose — CSS classes can claim anything,
 * only a measured box tells the truth.
 */
test.describe("Case Study Reactor responsive composition", () => {
  type Rect = {
    x: number;
    width: number;
    top: number;
    bottom: number;
    height: number;
    /** Document-relative top: immune to the page scrolling between measurements. */
    docTop: number;
  };

  type Layout = {
    viewportWidth: number;
    gridColumns: number;
    hostPosition: string;
    hostTop: string;
    host: Rect;
    panel: Rect;
    stageList: Rect;
    frame: Rect;
    diagram: Rect;
    stepper: Rect;
    stepHeights: number[];
    stepRights: number[];
    stageCount: number;
    docOverflow: number;
    sectionOverflow: number;
    /** Summary sentence inside the panel — present below `lg`, hidden beside the list. */
    panelSummaryVisible: boolean;
  };

  async function readLayout(page: Page): Promise<Layout> {
    return page.evaluate(() => {
      const emptyRect = (): Rect => ({ x: 0, width: 0, top: 0, bottom: 0, height: 0, docTop: 0 });
      const rectOf = (el: Element) => {
        const r = el.getBoundingClientRect();
        return {
          x: r.x,
          width: r.width,
          top: r.top,
          bottom: r.bottom,
          height: r.height,
          docTop: r.top + window.scrollY,
        };
      };
      const section = document.querySelector("#process");
      const island = document.querySelector("#process astro-island");
      // The island is wrapped in the column that becomes sticky from `lg`.
      const host = island?.parentElement;
      const grid = host?.parentElement;
      const list = document.querySelector("#process ol");
      const panel = document.querySelector("[data-reactor]");
      const summary = document.querySelector<HTMLElement>("[data-reactor-summary]");
      const frame = document.querySelector("[data-reactor-frame]");
      const diagram = document.querySelector("[data-reactor-diagram]");
      const stepper = document.querySelector("[data-reactor-stepper]");
      const steps = Array.from(document.querySelectorAll<HTMLElement>("[data-reactor-step]"));
      const sectionRect = section?.getBoundingClientRect();
      const viewport = document.documentElement.clientWidth;
      return {
        viewportWidth: viewport,
        gridColumns: grid ? getComputedStyle(grid).gridTemplateColumns.split(" ").length : 0,
        hostPosition: host ? getComputedStyle(host).position : "missing",
        hostTop: host ? getComputedStyle(host).top : "missing",
        host: host ? rectOf(host) : emptyRect(),
        panel: panel ? rectOf(panel) : emptyRect(),
        stageList: list ? rectOf(list) : emptyRect(),
        frame: frame ? rectOf(frame) : emptyRect(),
        diagram: diagram ? rectOf(diagram) : emptyRect(),
        stepper: stepper ? rectOf(stepper) : emptyRect(),
        stepHeights: steps.map((s) => Math.round(s.getBoundingClientRect().height)),
        stepRights: steps.map((s) => Math.round(s.getBoundingClientRect().right)),
        stageCount: document.querySelectorAll("[data-reactor-stage]").length,
        docOverflow: Math.max(0, document.documentElement.scrollWidth - viewport),
        sectionOverflow: sectionRect ? Math.max(0, Math.ceil(sectionRect.right) - viewport) : 0,
        panelSummaryVisible: summary
          ? getComputedStyle(summary).display !== "none" &&
            summary.getBoundingClientRect().height > 0
          : false,
      };
    });
  }

  async function openReactor(page: Page) {
    await page.goto("/work/ai-quranic-tafsir");
    await page.locator("#process").scrollIntoViewIfNeeded();
    await expect(page.locator("[data-reactor-stepper]")).toBeVisible({ timeout: 10_000 });
  }

  /**
   * Walk every stage and collect document-relative geometry. Stable slots mean
   * all five entries agree; Playwright auto-scrolling between clicks cancels
   * out because every measurement is document-relative.
   */
  async function walkStages(page: Page) {
    const rows: { panel: number; frame: number; listTop: number }[] = [];
    for (const id of ["problem", "data", "model", "system", "impact"]) {
      await page.locator(`[data-reactor-step="${id}"]`).click();
      const box = await readLayout(page);
      rows.push({
        panel: box.panel.height,
        frame: box.frame.height,
        listTop: box.stageList.docTop,
      });
    }
    return rows;
  }

  test.describe("wide desktop", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("the stage visual becomes a sticky column beside the list", async ({ page }) => {
      await openReactor(page);
      const layout = await readLayout(page);

      // Two real columns, with the list to the right of the stage visual.
      expect(layout.gridColumns).toBe(2);
      expect(layout.host.width).toBeGreaterThan(300);
      expect(layout.stageList.x).toBeGreaterThanOrEqual(layout.host.x + layout.host.width - 1);
      // The stage visual keeps its own narrower reading measure beside the list.
      expect(layout.diagram.width).toBeLessThan(layout.host.width);

      expect(layout.hostPosition).toBe("sticky");
      // Clears the fixed `h-16` header (`top-24` = 96px).
      expect(layout.hostTop).toBe("96px");
    });

    test("the sticky column stays pinned while the list scrolls past", async ({ page }) => {
      await openReactor(page);
      const before = await readLayout(page);

      await page.mouse.wheel(0, 320);
      await page.waitForTimeout(400);
      const after = await readLayout(page);

      // The list scrolled 320px up…
      expect(after.stageList.top).toBeLessThan(before.stageList.top - 250);
      // …while the stage column stayed exactly where it was, pinned at
      // `top-24` (96px) and clear of the fixed h-16 header. A static column
      // would have moved with the list.
      expect(Math.abs(after.host.top - before.host.top)).toBeLessThan(2);
      expect(Math.round(after.host.top)).toBeGreaterThanOrEqual(90);
      expect(Math.round(after.host.top)).toBeLessThanOrEqual(100);
      // The column is shorter than the list it annotates, so the pin range is
      // real rather than a container shorter than its own child.
      expect(before.host.height).toBeLessThan(before.stageList.height);
    });

    test("panel summary is not repeated next to the canonical list", async ({ page }) => {
      await openReactor(page);
      // The list already carries the same sentence for every stage.
      await expect(page.locator("[data-reactor-stage] p").first()).not.toBeEmpty();
      expect((await readLayout(page)).panelSummaryVisible).toBe(false);
    });

    test("the sticky panel keeps one height across all five stages", async ({ page }) => {
      await openReactor(page);
      const rows = await walkStages(page);
      // A panel that resized per stage would slide under the reader's cursor
      // while pinned, so the reserved slots have to hold at `lg` too.
      for (const row of rows) {
        expect(Math.abs(row.panel - rows[0].panel)).toBeLessThanOrEqual(1);
        expect(Math.abs(row.frame - rows[0].frame)).toBeLessThanOrEqual(1);
      }
    });

    test("keyboard focus stays visible and never scrolls the page", async ({ page }) => {
      await openReactor(page);
      const step = page.locator('[data-reactor-step="problem"]');
      await step.focus();
      const scrollBefore = await page.evaluate(() => window.scrollY);

      const ring = await step.evaluate((el) => {
        el.focus();
        const s = getComputedStyle(el);
        return { width: s.outlineWidth, style: s.outlineStyle };
      });
      // A real focus ring, not `outline: none`.
      expect(ring.style).not.toBe("none");
      expect(Number.parseFloat(ring.width)).toBeGreaterThanOrEqual(2);

      for (let i = 0; i < 4; i += 1) {
        await page.keyboard.press("ArrowRight");
      }
      await expect(page.locator("[data-reactor-stage-label]")).toHaveText("Impact");
      await expect(page.locator('[data-reactor-step="impact"]')).toBeFocused();
      // The focused control is on screen, and selecting a stage is not a scroll.
      await expect(page.locator('[data-reactor-step="impact"]')).toBeInViewport();
      expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
    });

    test("no horizontal drag and no hover-only affordance", async ({ page }) => {
      await openReactor(page);
      const info = await page.evaluate(() => {
        const panel = document.querySelector("[data-reactor]");
        const region = panel?.closest("#process");
        const styles = region ? getComputedStyle(region) : null;
        return {
          overflowX: styles?.overflowX ?? "none",
          cursor: region ? getComputedStyle(region).cursor : "auto",
        };
      });
      // No pan/scroll container, no grab cursor: the stage is not drag-driven.
      expect(["visible", "clip", "hidden"]).toContain(info.overflowX);
      expect(info.cursor).not.toBe("grab");
      expect(info.cursor).not.toBe("ew-resize");

      // Every control is reachable without a pointer: the stage buttons are
      // the only interactive elements, and they also answer to Enter.
      await page.locator('[data-reactor-step="problem"]').focus();
      await page.keyboard.press("Enter");
      await expect(page.locator('[data-reactor-step="problem"]')).toHaveAttribute(
        "aria-current",
        "step",
      );
    });
  });

  test.describe("tablet 768", () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test("stacks in normal flow at the reading measure, nothing pinned", async ({ page }) => {
      await openReactor(page);
      const layout = await readLayout(page);

      // One column, normal flow — `position: static` is the point, because a
      // sticky panel taller than its container would pin mid-paragraph.
      expect(layout.gridColumns).toBe(1);
      expect(layout.hostPosition).toBe("static");
      // Stage visual above, canonical list below, in that reading order.
      expect(layout.panel.bottom).toBeLessThanOrEqual(layout.stageList.top + 1);
      // The reading measure is preserved for prose.
      expect(layout.stageList.width).toBeLessThanOrEqual(720);
      expect(layout.docOverflow).toBe(0);
      expect(layout.sectionOverflow).toBe(0);
    });

    test("the panel still summarises the active stage without the list beside it", async ({
      page,
    }) => {
      await openReactor(page);
      expect((await readLayout(page)).panelSummaryVisible).toBe(true);
      await page.locator('[data-reactor-step="impact"]').click();
      await expect(page.locator("[data-reactor-summary]")).toContainText("honest refusal");
    });
  });

  test.describe("mobile 375", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("single column, no overflow, stepper wrapped above the stage", async ({ page }) => {
      await openReactor(page);
      const layout = await readLayout(page);

      expect(layout.gridColumns).toBe(1);
      expect(layout.hostPosition).toBe("static");
      // No horizontal scroll anywhere on the page.
      expect(layout.docOverflow).toBe(0);
      expect(layout.sectionOverflow).toBe(0);
      // Stepper first, then the panel, then the list.
      expect(layout.stepper.bottom).toBeLessThanOrEqual(layout.frame.top + 1);
      expect(layout.panel.bottom).toBeLessThanOrEqual(layout.stageList.top + 1);
      // Five stages, all inside the viewport, and tappable at ≥ 32px.
      expect(layout.stageCount).toBe(5);
      expect(layout.stepHeights).toHaveLength(5);
      for (const height of layout.stepHeights) {
        expect(height).toBeGreaterThanOrEqual(32);
      }
      for (const right of layout.stepRights) {
        expect(right).toBeLessThanOrEqual(375);
      }
    });

    test("switching stages never resizes the panel or nudges the list", async ({ page }) => {
      await openReactor(page);
      const rows = await walkStages(page);
      // The diagram frame and the text slot are both reserved, so the deepest
      // stage (model, five boxes) sits in the same box as the shallowest one.
      for (const row of rows) {
        expect(Math.abs(row.frame - rows[0].frame)).toBeLessThanOrEqual(1);
        expect(Math.abs(row.panel - rows[0].panel)).toBeLessThanOrEqual(1);
        expect(Math.abs(row.listTop - rows[0].listTop)).toBeLessThanOrEqual(1);
      }
    });

    test("every stage is reachable by keyboard with the same evidence", async ({ page }) => {
      await openReactor(page);
      await page.locator('[data-reactor-step="problem"]').focus();
      await page.keyboard.press("End");
      await expect(page.locator("[data-reactor-stage-label]")).toHaveText("Impact");
      await expect(page.locator('[data-reactor-step="impact"]')).toBeFocused();
      await expect(page.locator('[data-reactor-step="impact"]')).toBeInViewport();

      // The canonical list is the same content, in the same order, on mobile.
      const ids = await page
        .locator("[data-reactor-stage]")
        .evaluateAll((els) => els.map((el) => el.getAttribute("data-reactor-stage")));
      expect(ids).toEqual(["problem", "data", "model", "system", "impact"]);
      await expect(page.locator("#stage-impact")).toContainText("0.972");
    });
  });

  test("the ordered stages read as a normal sequence without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      javaScriptEnabled: false,
    });
    const page = await context.newPage();
    await page.goto("/work/ai-quranic-tafsir");

    // SSR only: the panel and the whole list are in the HTML.
    await expect(page.locator("[data-reactor]")).toBeVisible();
    await expect(page.locator("[data-reactor-stage]")).toHaveCount(5);
    await expect(page.locator("#stage-model")).toContainText("LLaMA 3.2 3B");
    // Hydration-dependent controls are absent, not dead.
    await expect(page.locator("[data-reactor-stepper]")).toHaveCount(0);
    // The reading column still measures correctly with no CSS from the island.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);

    await context.close();
  });
});
