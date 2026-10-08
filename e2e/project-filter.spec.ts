import { expect, test } from "@playwright/test";
import { waitForIslandHydration } from "./hydration";

/**
 * Task 2.3 — the homepage project filter: six `aria-pressed` chips inside a
 * fieldset (never `role="tab"`), state shareable via `?f=<slug>`, an `<output>`
 * empty state with a reset, and a FLIP glide instead of a teleporting grid.
 *
 * Every interaction waits for the island's hydration first (`waitForIslandHydration`)
 * because the chips only exist after React attaches — clicking SSR markup that
 * looks ready is a lottery (lesson F5.1 #5).
 */
const CHIPS = "#projects [data-filter-chip]";
const CARDS = "#projects [data-project-card]";

async function gotoHydrated(page: import("@playwright/test").Page, path = "/") {
  await page.goto(path);
  await expect(page.locator(CARDS)).toHaveCount(4);
  await waitForIslandHydration(page, "[data-project-card]");
  // Hydration ≠ state committed: wait for the chips themselves (F5.1 #6).
  await expect(page.locator(CHIPS)).toHaveCount(6);
}

test("clicking a chip filters the cards, syncs aria-pressed and writes ?f=", async ({ page }) => {
  await gotoHydrated(page);

  const ml = page.locator('[data-filter-chip="ml"]');
  await expect(ml).toHaveAttribute("aria-pressed", "false");
  await ml.click();

  await expect(page.locator(CARDS)).toHaveCount(2);
  await expect(ml).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('[data-filter-chip="all"]')).toHaveAttribute("aria-pressed", "false");
  await expect(page).toHaveURL(/\?f=ml/);

  await page.locator('[data-filter-chip="all"]').click();
  await expect(page.locator(CARDS)).toHaveCount(4);
  await expect(ml).toHaveAttribute("aria-pressed", "false");
  // "All" removes the param instead of writing ?f=all.
  await expect(page).not.toHaveURL(/\?f=/);
});

test("a shared ?f= deep link lands on the filtered view", async ({ page }) => {
  await gotoHydrated(page, "/?f=web");

  await expect(page.locator(CARDS)).toHaveCount(2);
  await expect(page.locator('[data-filter-chip="web"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveURL(/\?f=web/);
});

test("an unknown ?f= token falls back to All and is stripped from the URL", async ({ page }) => {
  await gotoHydrated(page, "/?f=bogus");

  await expect(page.locator(CARDS)).toHaveCount(4);
  await expect(page.locator('[data-filter-chip="all"]')).toHaveAttribute("aria-pressed", "true");
  // Normalized away instead of silently accepted.
  await expect(page).not.toHaveURL(/\?f=/);
});

test("a 0-count chip shows the <output> empty state and the reset works", async ({ page }) => {
  await gotoHydrated(page);

  await page.locator('[data-filter-chip="iot"]').click();
  await expect(page.locator(CARDS)).toHaveCount(0);
  const empty = page.locator("output.empty-state");
  await expect(empty).toBeVisible();
  await expect(empty).toContainText("IoT");

  await page.getByRole("button", { name: "Show all 4 projects" }).click();
  await expect(page.locator(CARDS)).toHaveCount(4);
  await expect(empty).toHaveCount(0);
  await expect(page).not.toHaveURL(/\?f=/);
});

test("chips activate with the keyboard (Enter selects, Space moves on)", async ({ page }) => {
  await gotoHydrated(page);

  await page.locator('[data-filter-chip="ml"]').focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(CARDS)).toHaveCount(2);
  await expect(page).toHaveURL(/\?f=ml/);

  await page.locator('[data-filter-chip="web"]').focus();
  await page.keyboard.press(" ");
  await expect(page.locator('[data-filter-chip="web"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('[data-filter-chip="ml"]')).toHaveAttribute("aria-pressed", "false");
  await expect(page).toHaveURL(/\?f=web/);
});

test("filtering glides surviving cards from their old slots (FLIP)", async ({ page }) => {
  await gotoHydrated(page);

  // Wrap `Element.prototype.animate` in-page and keep it installed across the
  // commit: React does not flush a discrete click synchronously (measured: the
  // DOM is still unfiltered when `.click()` returns), so the layout-effect FLIP
  // appears a tick later. The first keyframe of a FLIP tween is the card's OLD
  // offset — a teleporting grid would produce no tween (or an identity one).
  const probe = await page.evaluate(async () => {
    const orig = Element.prototype.animate;
    const calls: { target: string | null; start: string; duration: string }[] = [];
    Element.prototype.animate = function patched(
      this: Element,
      ...args: Parameters<Element["animate"]>
    ) {
      // Only the grid's own tweens count — unrelated `Element.animate` callers
      // (ambient library animations) must not pollute the probe. Card identity
      // lives on the element (FLIP snapshots are keyed by node), so the probe
      // reads the title back out of the card instead of an attribute value.
      if (!this.hasAttribute("data-project-card")) return orig.apply(this, args);
      const frames = args[0];
      const first = Array.isArray(frames) ? frames[0] : undefined;
      const options = args[1];
      calls.push({
        target: this.querySelector("h3")?.textContent?.trim() ?? null,
        start: String(first?.transform ?? ""),
        duration:
          typeof options === "object" && options !== null && "duration" in options
            ? String(options.duration)
            : String(options),
      });
      return orig.apply(this, args);
    };
    const restore = () => {
      Element.prototype.animate = orig;
    };
    try {
      document.querySelector<HTMLButtonElement>('#projects [data-filter-chip="ml"]')?.click();
      // Wait (bounded) for the post-click commit that creates the tweens.
      const deadline = Date.now() + 2000;
      while (calls.length < 2 && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 16));
      }
    } finally {
      restore();
    }
    return {
      calls,
      cards: document.querySelectorAll("#projects [data-project-card]").length,
    };
  });

  // The two ml cards survive and each gets a glide from its old slot.
  expect(probe.cards).toBe(2);
  expect(probe.calls).toHaveLength(2);
  expect(probe.calls.map((c) => c.target).sort()).toEqual([
    "IJO PLIS — IHSG & USD/IDR Forecasting Platform",
    "Red Devil Dynamics — AI Goal Timing Predictor for Manchester United",
  ]);
  for (const call of probe.calls) {
    expect(call.duration).toBe("320");
    // Non-identity start keyframe = real First→Last delta, not a no-op tween.
    expect(call.start).not.toBe("translate(0px, 0px)");
  }

  // And the grid settles at the filtered layout once the glide finishes.
  await expect(page.locator(CARDS)).toHaveCount(2);
  await expect(page.locator('[data-filter-chip="ml"]')).toHaveAttribute("aria-pressed", "true");
});
