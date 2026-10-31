import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { projectNodeId, requireLinkedProject } from "./project-data";

// Task 3.4 — "Deep-link masuk" (M6b): every way a reader can arrive at the
// Capability Map with a node already selected, and every way back out.
//
//   M3.4.1  From the Capability Stack (/skills) to the map with its node selected.
//   M3.4.2  From a project-card skill chip (Task 2.4) to the map with its node selected.
//   M3.4.3  From the map to `/projects/<slug>` and back; hash, selection and scroll restore.
//   M3.4.4  ClientRouter swallows `hashchange` for same-page anchors, so the island
//           resolves in-page anchors through one delegated click listener, and
//           follows `hashchange` for manual URL edits and back/forward.
//
// The selection mechanics are pinned in unit tests (`SignalLoom.test.tsx`,
// "SignalLoom deep links (Task 3.4)"); this spec proves the same behaviors in a
// real browser against the real 30-node graph and the real /skills page.
//
// Two root causes recorded from the t34 probes inform these assertions:
//   - After Playwright `.click()`s the panel's project-page link, `back()` restores
//     the scroll position Playwright *created* while scrolling the link into view
//     (a real user's click does not do that). The honest restore assertion is the
//     section intersecting the viewport, never the selected node's card — and no
//     `scrollIntoViewIfNeeded` may run before that rect poll, or it becomes vacuous.
//   - Node ids are derived from hrefs, never hard-coded: the graph and the data
//     file both grow, and a pinned slug would rot exactly like the count pins did
//     (T1.2/T1.4 lessons).

const HOME = "/";
// MOTION-18: the Capability Stack moved from /skills to /about#skills.
const SKILLS = "/about";

/** Hydration marker of the Signal Loom island: exactly one card is in the tab order. */
async function mapReady(page: Page) {
  await page.locator('[data-signal-node][tabindex="0"]').waitFor({ timeout: 20_000 });
}

/** The selected node's id, or null when nothing is selected. */
const selectedNode = (page: Page) =>
  page.locator("[data-signal-node][aria-current='true']").getAttribute("data-signal-node");

/** Capability anchor hrefs on /about (Capability Stack); each is `/#signal-capability-<id>`. */
async function capabilityHrefs(page: Page) {
  await page.goto(SKILLS);
  const hrefs = await page
    .locator(".cap-area-name a[href^='/#signal-capability-']")
    .evaluateAll((els) => els.map((el) => el.getAttribute("href") as string));
  expect(hrefs.length, "the Capability Stack must list capability anchors").toBeGreaterThan(0);
  return hrefs;
}

test.describe("Task 3.4 — deep links into the Capability Map (M6b)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("a Capability Stack anchor lands on the map with its node selected (M3.4.1)", async ({
    page,
  }) => {
    const href = (await capabilityHrefs(page))[0];
    const nodeId = href.slice("/#signal-".length);

    await page.locator(`a[href="${href}"]`).first().click();

    // Cross-path anchor navigation goes through ClientRouter: the URL gains the
    // hash and the island is mounted fresh, so the mount-time hash read selects.
    await page.waitForURL((url) => url.pathname === "/" && url.hash === `#signal-${nodeId}`);
    await mapReady(page);
    await expect(page.locator("[data-signal-node][aria-current='true']")).toHaveAttribute(
      "data-signal-node",
      nodeId,
    );

    // And the round trip closes: back() returns to the Capability Stack.
    await page.goBack();
    await page.waitForURL((url) => url.pathname === SKILLS);
    // The URL flips before ClientRouter swaps /about back in; /about is a much
    // larger document than /skills was (career spine + certifications), so the
    // swap needs the repo's cold-navigation budget (15s, T1.6), not the 5s default.
    await expect(page).toHaveTitle(/^About/, { timeout: 15_000 });
    await expect(
      page.locator(".cap-area-name a[href^='/#signal-capability-']").first(),
    ).toBeVisible();
  });

  test("Tab reaches a Capability Stack link and its focus ring is real (M3.4.1)", async ({
    page,
  }) => {
    await page.goto(SKILLS);
    await expect(
      page.locator(".cap-area-name a[href^='/#signal-capability-']").first(),
    ).toBeVisible();

    // Bounded walk: the toggle/nav chrome sits between the page top and the
    // capability links; Tab must land there within a generous budget.
    let focusedHref: string | null = null;
    for (let i = 0; i < 40 && focusedHref === null; i++) {
      await page.keyboard.press("Tab");
      focusedHref = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        const href = el?.getAttribute("href") ?? "";
        return href.startsWith("/#signal-capability-") ? href : null;
      });
    }
    expect(focusedHref, "Tab must reach a capability link").not.toBeNull();

    // The focus ring is the keyboard affordance, asserted from computed style:
    // `focus-visible:outline-2 focus-visible:outline-brand` must actually paint.
    // Non-transparent color, not a specific rgb, so the test survives both themes.
    const ring = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return null;
      const s = getComputedStyle(el);
      return {
        focusVisible: el.matches(":focus-visible"),
        outlineStyle: s.outlineStyle,
        outlineWidth: s.outlineWidth,
        outlineColor: s.outlineColor,
      };
    });
    if (!ring) throw new Error("expected a focused element with computed style");
    expect(ring.focusVisible).toBe(true);
    expect(ring.outlineStyle).toBe("solid");
    expect(ring.outlineWidth).toBe("2px");
    expect(ring.outlineColor).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("a project-card skill chip selects the map node it points at (M3.4.2)", async ({ page }) => {
    await page.goto(HOME);
    // The map is below the fold on a plain home load; hydrate it first.
    await page.locator("#systems-in-motion").scrollIntoViewIfNeeded();
    await mapReady(page);

    // Chips render as relative `#signal-capability-*` anchors (Task 2.4). The
    // fallback skills resolve to `#systems-in-motion` and do not match — which is
    // fine, this microtask is about the ones that land on a capability node.
    const chips = page.locator("a[href^='#signal-capability-']");
    const chipCount = await chips.count();
    expect(chipCount).toBeGreaterThan(0);

    // The plain load selects the graph's default hub. Pick a chip whose node is
    // a genuine *change*, so the assertion cannot pass vacuously.
    const defaultNode = await selectedNode(page);
    let href = "";
    for (let i = 0; i < chipCount; i++) {
      const candidate = (await chips.nth(i).getAttribute("href")) as string;
      if (candidate.slice("#signal-".length) !== defaultNode) {
        href = candidate;
        break;
      }
    }
    expect(href, "a chip must point at a node other than the default hub").not.toBe("");
    const nodeId = href.slice("#signal-".length);

    const chip = page.locator(`a[href="${href}"]`).first();
    await chip.scrollIntoViewIfNeeded();
    await chip.click();

    // Same-page anchor: ClientRouter owns the URL (pushState, no hashchange) and
    // the island's delegated click listener owns the selection. Both must agree.
    await expect(page.locator("[data-signal-node][aria-current='true']")).toHaveAttribute(
      "data-signal-node",
      nodeId,
    );
    await expect(page).toHaveURL(new RegExp(`#signal-${nodeId}$`));
  });

  test("map → project page → back: hash, selection and scroll restore (M3.4.3)", async ({
    page,
  }) => {
    const project = requireLinkedProject();
    const nodeId = projectNodeId(project.title);
    const hash = `#signal-${nodeId}`;

    // Deep link straight to the project node. The browser scrolls to the card's
    // li anchor (`scroll-padding-top: 5rem` clears the fixed header) and the
    // mount-time hash read selects it.
    await page.goto(`${HOME}${hash}`);
    await mapReady(page);
    await expect(page.locator("[data-signal-node]")).toHaveCount(30);
    await expect(page.locator("[data-signal-node][aria-current='true']")).toHaveAttribute(
      "data-signal-node",
      nodeId,
    );

    // Re-select a *different* project node so `handleSelect` runs on this
    // history entry — the t34 probe proved a deep-link-only entry never calls
    // it (mount-time hash read selects instead), which made the M3.4.3 fix
    // line invisible to the mutation `replaceState(null, …)`: under that
    // mutation back() leaves the /projects DOM on screen, but the test passed
    // because the round trip started with an entry that still held Astro's
    // `{ index, scrollX, scrollY }` state. This click is what gives `replaceState
    // (history.state, …)` its teeth: the fix must survive a selection change
    // on the entry before the reader leaves and returns.
    const secondProjectId = await page.evaluate((skip) => {
      const nodes = Array.from(
        document.querySelectorAll("[data-signal-node][data-node-kind='project']"),
      );
      const other = nodes.find((n) => n.getAttribute("data-signal-node") !== skip);
      return other?.getAttribute("data-signal-node") ?? null;
    }, nodeId);
    expect(secondProjectId).not.toBeNull();
    await page.locator(`[data-signal-node='${secondProjectId}']`).click();
    await expect(page.locator("[data-signal-node][aria-current='true']")).toHaveAttribute(
      "data-signal-node",
      secondProjectId,
    );
    const secondHash = `#signal-${secondProjectId}`;

    // The panel follows the selection, so the project-page link now targets the
    // second project — read *after* the click because its href moved.
    const panelLink = page.locator("a[data-signal-detail-project]");
    await expect(panelLink).toBeVisible();
    const projectPath = (await panelLink.getAttribute("href")) as string;
    expect(projectPath).toMatch(/^\/work\/[a-z0-9-]+$/);

    await panelLink.click();
    await page.waitForURL((url) => url.pathname === projectPath);
    await expect(page.locator("h1")).toBeVisible();

    // M3.4.3 fix: `handleSelect` preserves the existing history state (instead of
    // writing `null`), so ClientRouter's onPopState can swap the DOM back and
    // this entry's hash survives — the round trip is restored, not reset to home.
    await page.goBack();
    await page.waitForURL((url) => url.pathname === "/" && url.hash === secondHash);

    // The island re-hydrates only once the restored scroll brings the section
    // back on screen (`client:visible`) — this wait is the first half of the
    // scroll-restore assertion, and it would time out if back() dropped the
    // reader at the hero with the map far off-screen.
    await mapReady(page);
    await expect(page.locator("[data-signal-node]")).toHaveCount(30);
    await expect(page.locator("[data-signal-node][aria-current='true']")).toHaveAttribute(
      "data-signal-node",
      secondProjectId,
    );

    // The second half, measured directly and after hydration (no scroll nudge
    // before it — the t34 root cause: Playwright's own click scrolls; asserting
    // the selected card would then measure the harness, not the product).
    await expect
      .poll(
        async () =>
          page.evaluate(() => {
            const el = document.querySelector("#systems-in-motion");
            if (!el) return false;
            const r = el.getBoundingClientRect();
            return r.top < window.innerHeight && r.bottom > 0;
          }),
        { timeout: 15_000 },
      )
      .toBe(true);
  });

  test("manual hash edits re-select via hashchange, and back() restores the prior state (M3.4.4)", async ({
    page,
  }) => {
    const nodeId = (await capabilityHrefs(page))[0].slice("/#signal-".length);

    // Plain home load: the default narrative hub is selected, and the chosen
    // capability is a genuine change (a vacuous re-select would not test the
    // hashchange listener at all).
    await page.goto(HOME);
    await page.locator("#systems-in-motion").scrollIntoViewIfNeeded();
    await mapReady(page);
    const defaultNode = await selectedNode(page);
    expect(nodeId).not.toBe(defaultNode);

    // A manual URL edit (typed address, share link, or a history entry) fires
    // `hashchange` — the one route ClientRouter cannot serve for same-page
    // anchors, and exactly why the island keeps the listener (M3.4.4).
    await page.evaluate((id) => {
      window.location.hash = `#signal-${id}`;
    }, nodeId);
    await expect(page.locator("[data-signal-node][aria-current='true']")).toHaveAttribute(
      "data-signal-node",
      nodeId,
    );
    await expect(page).toHaveURL(new RegExp(`#signal-${nodeId}$`));

    // The edit pushed a history entry of its own, so back() returns to the plain
    // URL and the listener re-selects the default hub — the reversal proves the
    // mechanism is symmetric, not just a one-way re-select.
    await page.goBack();
    await page.waitForURL((url) => url.hash === "");
    await expect(page.locator("[data-signal-node][aria-current='true']")).toHaveAttribute(
      "data-signal-node",
      defaultNode as string,
    );
  });
});
