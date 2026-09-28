import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

// Q4.2 — accessibility and browser behaviour for the two sprint features.
//
// Every claim here was first measured in a real browser (Chromium) before the
// fixes landed, so the assertions pin observed defects rather than intent:
// three of them (the inert fallback cards, the 40-word control names, the
// run-together stepper names) and one pre-existing site-wide bug that only
// showed up under the dark/light check — the theme store pinned the default
// accent as an inline style, which outranks `:root` and `.dark`, so light mode
// kept the dark palette's brand.

const HOME = "/";
const CASE_STUDY = "/work/ai-quranic-tafsir";

/** Scroll the section in, then wait for the island to take over its cards. */
async function openSignalLoom(page: Page) {
  await page.goto(HOME);
  await page.locator("#systems-in-motion").scrollIntoViewIfNeeded();
  // Hydration turns the fallback cards into buttons with a roving tabindex.
  await page.locator('[data-signal-node][tabindex="0"]').waitFor({ timeout: 20_000 });
}

async function openReactor(page: Page) {
  await page.goto(CASE_STUDY);
  await page.locator("#process").scrollIntoViewIfNeeded();
  await page.locator("[data-reactor-stepper]").waitFor({ timeout: 20_000 });
}

const horizontalOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test.describe("Q4.2 — keyboard-only navigation", () => {
  test("Signal Loom is one tab stop, and arrows, Home, and End move selection", async ({
    page,
  }) => {
    await openSignalLoom(page);

    // Roving tabindex: exactly one card is in the tab order, so the graph is a
    // single stop rather than thirteen.
    await expect(page.locator('[data-signal-node][tabindex="0"]')).toHaveCount(1);
    await expect(page.locator('[data-signal-node][tabindex="-1"]')).toHaveCount(12);

    await page.locator('[data-signal-node][tabindex="0"]').focus();
    const start = await page
      .locator('[data-signal-node][tabindex="0"]')
      .getAttribute("data-signal-node");

    // Arrow moves focus and selection together, in both directions.
    await page.keyboard.press("ArrowRight");
    const right = await page.evaluate(() => ({
      focused: document.activeElement?.getAttribute("data-signal-node"),
      current: document
        .querySelector("[data-signal-node][aria-current='true']")
        ?.getAttribute("data-signal-node"),
    }));
    expect(right.focused).toBe(right.current);
    expect(right.focused).not.toBe(start);

    await page.keyboard.press("ArrowLeft");
    await expect(page.locator('[data-signal-node][tabindex="0"]')).toHaveAttribute(
      "data-signal-node",
      start as string,
    );

    // Home and End reach the true ends of the combined capability + project order.
    await page.keyboard.press("End");
    const last = await page.evaluate(() =>
      document.activeElement?.getAttribute("data-signal-node"),
    );
    await page.keyboard.press("Home");
    const first = await page.evaluate(() =>
      document.activeElement?.getAttribute("data-signal-node"),
    );
    expect(first).not.toBe(last);
    expect(await page.locator("[data-signal-node]").first().getAttribute("data-signal-node")).toBe(
      first,
    );
  });

  test("Signal Loom arrows cross from the capability zone into the project zone", async ({
    page,
  }) => {
    await openSignalLoom(page);
    // The two zones are separate lists, so a plain roving tabindex could never
    // leave the capability column. The island walks one combined order instead.
    await page.locator('[data-signal-node][tabindex="0"]').focus();
    const kinds: string[] = [];
    for (let i = 0; i < 8; i += 1) {
      kinds.push(
        (await page.evaluate(() =>
          document.activeElement?.getAttribute("data-node-kind"),
        )) as string,
      );
      await page.keyboard.press("ArrowRight");
    }
    expect(new Set(kinds).size).toBe(2);
  });

  test("Signal Loom arrow keys never scroll the page", async ({ page }) => {
    await openSignalLoom(page);
    await page.locator('[data-signal-node][tabindex="0"]').focus();
    const before = await page.evaluate(() => Math.round(window.scrollY));
    for (let i = 0; i < 4; i += 1) {
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowUp");
    }
    // focus() may legitimately pull a wrapped target into view, but the
    // keypress itself must not drive the page.
    expect(
      Math.abs((await page.evaluate(() => Math.round(window.scrollY))) - before),
    ).toBeLessThanOrEqual(80);
  });

  test("the reactor stepper is one tab stop, and arrows move the active stage", async ({
    page,
  }) => {
    await openReactor(page);
    await expect(page.locator('[data-reactor-step][tabindex="0"]')).toHaveCount(1);
    await expect(page.locator('[data-reactor-step][aria-current="step"]')).toHaveCount(1);

    await page.locator('[data-reactor-step="problem"]').focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("[data-reactor-stage-label]")).toHaveText("Data");
    await expect(page.locator('[data-reactor-step="data"]')).toBeFocused();
    await expect(page.locator('[data-reactor-step="data"][aria-current="step"]')).toHaveCount(1);

    await page.keyboard.press("End");
    await expect(page.locator("[data-reactor-stage-label]")).toHaveText("Impact");
    await page.keyboard.press("Home");
    await expect(page.locator("[data-reactor-stage-label]")).toHaveText("Problem");
  });
});

test.describe("Q4.2 — focus visibility", () => {
  test("both features show a visible focus ring on the card and the step", async ({ page }) => {
    await openSignalLoom(page);
    const loomRing = await page.locator('[data-signal-node][tabindex="0"]').evaluate((el) => {
      el.focus();
      const s = getComputedStyle(el);
      return {
        width: s.outlineWidth,
        style: s.outlineStyle,
        visible: el.matches(":focus-visible"),
      };
    });
    expect(loomRing.visible).toBe(true);
    expect(Number.parseFloat(loomRing.width)).toBeGreaterThanOrEqual(2);
    expect(loomRing.style).not.toBe("none");

    await openReactor(page);
    const stepRing = await page.locator('[data-reactor-step="data"]').evaluate((el) => {
      el.focus();
      const s = getComputedStyle(el);
      return {
        width: s.outlineWidth,
        style: s.outlineStyle,
        visible: el.matches(":focus-visible"),
      };
    });
    expect(stepRing.visible).toBe(true);
    expect(Number.parseFloat(stepRing.width)).toBeGreaterThanOrEqual(2);
  });
});

test.describe("Q4.2 — names, descriptions, selected state, reading order", () => {
  test("Signal Loom cards are named by kind and label, not by a 30-word summary", async ({
    page,
  }) => {
    await openSignalLoom(page);
    const names = await page.locator("[data-signal-node]").evaluateAll((els) =>
      els.map((el) => ({
        id: el.getAttribute("data-signal-node"),
        name: el.getAttribute("aria-label"),
        words: (el.getAttribute("aria-label") ?? "").split(/\s+/).length,
      })),
    );
    expect(names).toHaveLength(13);
    for (const entry of names) {
      expect(entry.name, `${entry.id} needs a concise accessible name`).toBeTruthy();
      expect(entry.words).toBeLessThanOrEqual(12);
    }
    // The visible title is still inside the name (WCAG 2.5.3, Label in Name).
    await expect(page.getByRole("button", { name: "Capability: Web Development" })).toHaveCount(1);
    await expect(
      page.getByRole("button", { name: /^Evidence: AI Quranic Tafsir Assistant/ }),
    ).toHaveCount(1);
  });

  test("the project summary stays in the tree and is announced once, by the live region", async ({
    page,
  }) => {
    await openSignalLoom(page);
    // Concise control name, full detail in the subtree and in the live region —
    // never the same 30 words twice for one keypress.
    await expect(page.locator("[data-signal-status]")).toHaveAttribute("aria-live", "polite");
    const summary = await page
      .locator('[data-signal-node][data-node-kind="project"]')
      .first()
      .locator("[data-node-summary]")
      .textContent();
    expect((summary ?? "").length).toBeGreaterThan(20);
    expect(await page.locator("[data-signal-status-text]").textContent()).not.toBe(summary);
  });

  test("Signal Loom exposes the selected state and both zones as labelled regions", async ({
    page,
  }) => {
    await openSignalLoom(page);
    const selected = page.locator('[data-signal-node][aria-current="true"]');
    await expect(selected).toHaveCount(1);
    await expect(selected).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator('[data-signal-node][aria-pressed="true"]')).toHaveCount(1);

    await expect(page.getByRole("region", { name: "Capability nodes" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Project evidence nodes" })).toBeVisible();
    await expect(page.getByRole("list", { name: "Capabilities" })).toBeVisible();
    await expect(page.getByRole("list", { name: "Projects" })).toBeVisible();
  });

  test("Signal Loom reading order runs capabilities, then evidence, then the status", async ({
    page,
  }) => {
    await openSignalLoom(page);
    // One selector, document order: the simplest way to state a reading order.
    const order = await page.evaluate(() =>
      [
        ...document.querySelectorAll(
          "#systems-in-motion [data-signal-node], #systems-in-motion [data-signal-status]",
        ),
      ].map((el) =>
        el.hasAttribute("data-signal-node") ? el.getAttribute("data-node-kind") : "status",
      ),
    );
    expect(order.filter((k) => k === "project")).toHaveLength(5);
    expect(order.filter((k) => k === "capability")).toHaveLength(8);
    // Every capability precedes every project, and the status comes last.
    expect(order.indexOf("project")).toBeGreaterThan(order.lastIndexOf("capability"));
    expect(order.at(-1)).toBe("status");
  });

  test("the reactor stepper is described, and the panel names the stage it describes", async ({
    page,
  }) => {
    await openReactor(page);
    const stepper = page.locator("[data-reactor-stepper]");
    await expect(stepper).toHaveAttribute("aria-label", "Process stages");
    const describedBy = await stepper.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    await expect(page.locator(`#${describedBy}`)).toHaveText(/arrow keys/i);

    // The panel is a region that says which stage it is showing.
    await expect(
      page.getByRole("region", { name: /Active stage: Stage 1 of 5 — Problem/ }),
    ).toBeVisible();
    // The diagram is an image with a real name, not an unlabelled graphic.
    const diagram = page.locator("[data-reactor-diagram]");
    await expect(diagram).toHaveAttribute("role", "img");
    expect((await diagram.getAttribute("aria-labelledby")) ?? "").not.toBe("");
    await expect(page.getByRole("img", { name: /Problem/ })).toBeVisible();
  });

  test("the reactor stepper names keep a word boundary between ordinal and label", async ({
    page,
  }) => {
    await openReactor(page);
    const names = await page
      .locator("[data-reactor-step]")
      .evaluateAll((els) => els.map((el) => el.textContent?.trim() ?? ""));
    // Regression: the visible gap came from `gap-2`, which name computation does
    // not see, so the names used to read "01Problem".
    expect(names).toEqual(["01 Problem", "02 Data", "03 Model", "04 System", "05 Impact"]);
    for (const name of names) {
      expect(name).toMatch(/^\d{2} [A-Z]/);
    }
  });

  test("the reactor announces the active stage and reads stepper, panel, then the list", async ({
    page,
  }) => {
    await openReactor(page);
    const status = page.locator("[data-reactor-status]");
    await expect(status).toHaveAttribute("aria-live", "polite");
    await expect(status).toHaveText("Stage 1 of 5: Problem");

    await page.locator('[data-reactor-step="problem"]').focus();
    await page.keyboard.press("ArrowRight");
    await expect(status).toHaveText("Stage 2 of 5: Data");

    const order = await page.evaluate(() =>
      [
        ...document.querySelectorAll(
          "[data-reactor-stepper], [data-reactor] section, [data-reactor-stage]",
        ),
      ].map((el) =>
        el.hasAttribute("data-reactor-stepper")
          ? "stepper"
          : el.hasAttribute("data-reactor-stage")
            ? "list"
            : "panel",
      ),
    );
    expect(order[0]).toBe("stepper");
    expect(order[1]).toBe("panel");
    expect(order[2]).toBe("list");
  });
});

test.describe("Q4.2 — reduced motion", () => {
  // `test.use({ reducedMotion })` is silently ignored in this Playwright
  // version — verified by reading `matchMedia` back in the page — so the
  // preference is emulated per test, before the island hydrates.
  test("Signal Loom drops the travelling signals but keeps the graph and keyboard control", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openSignalLoom(page);
    await page.waitForTimeout(1200); // let any timeline that should not exist run
    // No animated dots…
    await expect(page.locator("[data-signal-dot]")).toHaveCount(0);
    // …but the connector plane, the emphasis, and selection all survive.
    expect(await page.locator("[data-edge]").count()).toBeGreaterThan(0);
    expect(await page.locator("[data-edge][stroke*='brand']").count()).toBeGreaterThan(0);
    await page.locator('[data-signal-node][tabindex="0"]').focus();
    await page.keyboard.press("End");
    await expect(page.locator("[data-signal-node][aria-current='true']")).toHaveCount(1);
    expect((await page.locator("[data-signal-status-text]").textContent())?.length).toBeGreaterThan(
      10,
    );
  });

  test("the reactor renders the diagram without the entry animation", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openReactor(page);
    await expect(page.locator("[data-reactor]")).not.toHaveAttribute(
      "data-reactor-animate",
      "true",
    );
    await expect(page.locator("[data-reactor-diagram]")).toHaveCount(1);
    await expect(page.locator("[data-reactor-stage]")).toHaveCount(5);
    // Nothing is left mid-animation, so the diagram is fully opaque immediately.
    const opacity = await page
      .locator("[data-reactor-node]")
      .first()
      .evaluate((el) => getComputedStyle(el).opacity);
    expect(Number(opacity)).toBe(1);
  });
});

test.describe("Q4.2 — no JavaScript and no animation enhancement", () => {
  test("Signal Loom keeps every card's content and offers no dead controls", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      javaScriptEnabled: false,
    });
    const page = await context.newPage();
    await page.goto(HOME);

    const fallback = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("[data-signal-node]")];
      return {
        total: nodes.length,
        buttons: nodes.filter((n) => n.tagName === "BUTTON").length,
        links: nodes.filter((n) => n.tagName === "A").length,
        linksWithoutHref: nodes.filter((n) => n.tagName === "A" && !n.getAttribute("href")).length,
        unreachables: nodes.filter((n) => n.getAttribute("tabindex") === "-1").length,
        headings: [...document.querySelectorAll("#systems-in-motion h3")].map((h) => h.textContent),
        status: document.querySelector("[data-signal-status-text]")?.textContent ?? "",
        // The link name is announced on activation, so it has to be the concise
        // kind + title form rather than the card's whole content — and the same
        // one the hydrated button announces.
        links3: nodes
          .filter((n) => n.tagName === "A")
          .map((n) => {
            const spans = [...n.querySelectorAll("span")];
            return {
              name: n.getAttribute("aria-label") ?? "",
              kind: spans[0]?.textContent ?? "",
              title: spans[1]?.textContent ?? "",
              summary: spans[2]?.textContent ?? "",
              content: (n.textContent ?? "").replace(/\s+/g, " ").trim(),
            };
          }),
      };
    });

    expect(fallback.total).toBe(13);
    // Regression: every card used to be a button, 12 of them unreachable and all
    // of them inert with scripts off.
    expect(fallback.buttons).toBe(0);
    expect(fallback.unreachables).toBe(0);
    // The five project cards navigate to real pages instead of swallowing a click.
    expect(fallback.links).toBe(5);
    expect(fallback.linksWithoutHref).toBe(0);
    for (const link of fallback.links3) {
      // Names are not bounded by a word count — real titles run from three to ten
      // words — so pin the shape instead: kind + the card's own title, with the
      // 30-word summary left out of the name.
      expect(link.name).toBe(`${link.kind}: ${link.title}`);
      expect(link.summary.length).toBeGreaterThan(10);
      expect(link.name.length).toBeLessThan(link.content.length);
    }
    expect(fallback.headings).toEqual(["Capability groups", "Project evidence"]);
    expect(fallback.status.length).toBeGreaterThan(10);
    expect(await horizontalOverflow(page)).toBe(0);

    await context.close();
  });

  test("a fallback project link actually reaches the project page", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      javaScriptEnabled: false,
    });
    const page = await context.newPage();
    await page.goto(HOME);
    const href = await page
      .locator('#systems-in-motion a[data-signal-node][data-node-kind="project"]')
      .first()
      .getAttribute("href");
    expect(href).toBeTruthy();
    const response = await page.goto(href as string);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();

    await context.close();
  });

  test("the reactor still reads as an ordered sequence with scripts off", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      javaScriptEnabled: false,
    });
    const page = await context.newPage();
    await page.goto(CASE_STUDY);

    // SSR panel and the whole canonical list, in order.
    await expect(page.locator("[data-reactor-stage]")).toHaveCount(5);
    const ids = await page
      .locator("[data-reactor-stage]")
      .evaluateAll((els) => els.map((el) => el.getAttribute("data-reactor-stage")));
    expect(ids).toEqual(["problem", "data", "model", "system", "impact"]);
    // Hydration-dependent controls are absent rather than dead.
    await expect(page.locator("[data-reactor-stepper]")).toHaveCount(0);
    // The first stage is fully described, diagram included.
    await expect(page.locator("[data-reactor-diagram]")).toHaveCount(1);
    await expect(page.locator("#stage-impact")).toContainText("0.972");
    expect(await horizontalOverflow(page)).toBe(0);

    await context.close();
  });
});

test.describe("Q4.2 — dark, light, and zoom", () => {
  test("light mode uses the light palette's own brand, not the dark one", async ({ page }) => {
    await page.goto(HOME);
    await page.locator("[data-theme-toggle]").click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);

    const light = await page.evaluate(() => {
      const s = getComputedStyle(document.documentElement);
      return {
        brandRgb: s.getPropertyValue("--color-brand-rgb").trim(),
        inlineBrand: document.documentElement.style.getPropertyValue("--color-brand-rgb").trim(),
        borderRgb: s.getPropertyValue("--color-border-rgb").trim(),
        text: s.getPropertyValue("--color-text-primary-rgb").trim(),
      };
    });

    // Regression: the theme store wrote the default accent as an inline style on
    // <html>, which outranks :root and .dark — so light mode kept the dark
    // palette's brand (122 140 111) and its weaker contrast while every other
    // token (border, text) correctly resolved to the light palette.
    expect(light.inlineBrand).toBe("");
    expect(light.brandRgb).toBe("93 107 84");
    expect(light.borderRgb).toBe("226 228 222");
    expect(light.text).toBe("18 19 16");
  });

  test("dark mode still uses the dark brand after the same round trip", async ({ page }) => {
    await page.goto(HOME);
    await expect(page.locator("html")).toHaveClass(/dark/);
    expect(
      await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue("--color-brand-rgb").trim(),
      ),
    ).toBe("122 140 111");

    await page.locator("[data-theme-toggle]").click();
    await page.locator("[data-theme-toggle]").click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    expect(
      await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue("--color-brand-rgb").trim(),
      ),
    ).toBe("122 140 111");
  });

  test("both features stay readable and interactive in light mode", async ({ page }) => {
    await page.goto(HOME);
    await page.locator("[data-theme-toggle]").click();
    await openSignalLoom(page);
    // The brand emphasis resolves from tokens, so it changes with the palette.
    const stroke = await page
      .locator("[data-edge]")
      .first()
      .evaluate((el) => getComputedStyle(el).stroke);
    expect(stroke).not.toBe("none");
    await page.locator('[data-signal-node][tabindex="0"]').focus();
    await page.keyboard.press("End");
    await expect(page.locator("[data-signal-node][aria-current='true']")).toHaveCount(1);

    await openReactor(page);
    await expect(page.locator("[data-reactor-diagram]")).toHaveCount(1);
    await page.locator('[data-reactor-step="problem"]').focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("[data-reactor-stage-label]")).toHaveText("Data");
  });

  // WCAG 1.4.10 Reflow: a 200% zoom of a 1280x800 window is a 640px layout,
  // and 400% reflow is the 320px case. No horizontal scrolling, no lost content.
  for (const [label, width, height] of [
    ["200% zoom", 640, 400],
    ["400% reflow", 320, 640],
  ] as const) {
    test(`home holds at ${label} (${width}x${height})`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await openSignalLoom(page);
      expect(await horizontalOverflow(page)).toBe(0);
      await expect(page.locator("[data-signal-node]")).toHaveCount(13);
      await expect(page.getByRole("region", { name: "Capability nodes" })).toBeVisible();
      await expect(page.getByRole("region", { name: "Project evidence nodes" })).toBeVisible();
      await expect(page.locator("[data-signal-status-text]")).toBeVisible();
      // The connector plane is md+ only; below it the cards carry the structure.
      await expect(page.locator("#systems-in-motion svg")).toBeHidden();
      // Selection still works at this width.
      await page.locator('[data-signal-node][tabindex="0"]').focus();
      await page.keyboard.press("End");
      await expect(page.locator("[data-signal-node][aria-current='true']")).toHaveCount(1);
    });

    test(`the reactor holds at ${label} (${width}x${height})`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await openReactor(page);
      expect(await horizontalOverflow(page)).toBe(0);
      await expect(page.locator("[data-reactor-step]")).toHaveCount(5);
      await expect(page.locator("[data-reactor-stage]")).toHaveCount(5);
      await expect(page.locator("[data-reactor-diagram]")).toHaveCount(1);
      await page.locator('[data-reactor-step="problem"]').focus();
      await page.keyboard.press("End");
      await expect(page.locator("[data-reactor-stage-label]")).toHaveText("Impact");
    });
  }
});
